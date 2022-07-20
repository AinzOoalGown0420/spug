from sshtunnel import SSHTunnelForwarder
import random,socket
from libs.ssh import SSH, AuthenticationException
from apps.host.models import Host
import paramiko
from io import StringIO
from libs.utils import AttrDict, human_datetime
from apps.host.utils import fetch_host_extend, check_os_type, HostExtend
import json

def net_is_used(ip='127.0.0.1'):
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    while True:
        local_port = random.randint(15000, 20000)
        try:
            s.connect((ip, local_port))
            s.shutdown(2)
        except:
            break
    return local_port

class agentssh(SSH):
    def __init__(self,agent_ip, hostname, port=22, username='root', pkey=None, password=None, default_env=None,
                 connect_timeout=10):
        self.local_port = net_is_used()
        super().__init__('127.0.0.1', port=self.local_port, username=username, pkey=pkey, password=password,
                       default_env=None,connect_timeout=10)
        host = Host.objects.filter(hostname=agent_ip).first()
        pkey=paramiko.RSAKey.from_private_key(StringIO(host.pkey))
        self.server = SSHTunnelForwarder(
            ssh_address_or_host=agent_ip,  # 跳板机B地址
            ssh_port=host.port,  # 跳板机B端口
            ssh_username=host.username,  # 跳板机B账号
            #ssh_password=agent_pw,  # 跳板机B密码
            ssh_pkey=pkey,
            local_bind_address=('127.0.0.1', self.local_port),
            remote_bind_address=(hostname, port)  # 目标机器A地址，端口
        )
        self.server.start()
        print("SSHTunnel is work!")

    def __exit__(self, exc_type, exc_val, exc_tb):
        super().__exit__(exc_type, exc_val, exc_tb)
        self.server.stop()
        self.server = None

def _agent_sync_host_extend(host, private_key=None, public_key=None, password=None, ssh=None):
    if not ssh:
        print("ssh is none")
        kwargs = host.to_dict(selects=('agent_ip','hostname', 'port', 'username'))
        ssh = _get_agentssh(kwargs, host.pkey, private_key, public_key, password)
    form = AttrDict(fetch_host_extend(ssh))
    form.disk = json.dumps(form.disk)
    form.public_ip_address = json.dumps(form.public_ip_address)
    form.private_ip_address = json.dumps(form.private_ip_address)
    form.updated_at = human_datetime()
    form.os_type = check_os_type(form.os_name)
    if hasattr(host, 'hostextend'):
        extend = host.hostextend
        extend.update_by_dict(form)
    else:
        extend = HostExtend.objects.create(host=host, **form)
    return extend

def _get_agentssh(kwargs, pkey=None, private_key=None, public_key=None, password=None):
    try:
        ssh = agentssh(pkey=pkey or private_key, **kwargs)
        ssh.get_client()
        return ssh
    except AuthenticationException as e:
        if password:
            with agentssh(password=str(password), **kwargs) as ssh:
                ssh.add_public_key(public_key)
            return _get_agentssh(kwargs, private_key)
        raise e

