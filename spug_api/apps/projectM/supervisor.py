import re
from libs.ssh import SSH, AuthenticationException
from apps.projectM.models import project1,queue
from apps.host.models import Host
from libs import human_datetime

def fetch_queue(project_id):
    proj = project1.objects.get(pk=project_id)
    host1 = Host.objects.get(hostname=proj.supervisor_host)
    conf_path=proj.supervisor_confdir.replace('conf.d/','supervisord.conf')
    ssh = host1.get_ssh()
    with ssh:
        if conf_path == proj.supervisor_confdir:
            conf_path = proj.supervisor_confdir.replace('supervisord.d/', 'supervisord.conf')
            code, out = ssh.exec_command_raw("cat " + proj.supervisor_confdir + proj.code_path.split('/')[-1] + '.ini')
        else:
            code, out = ssh.exec_command_raw("cat " + proj.supervisor_confdir + proj.code_path.split('/')[-1] + '.conf')
        getstat_comm='sudo supervisorctl -c '+ conf_path+' status '
        response=[]
        if code == 0:
            pnamere=re.compile('\[program:(.*)\]')
            pnames=pnamere.findall(out)
            pcommandre=re.compile('command=(.*)\n')
            pcommands=pcommandre.findall(out)
            plogre=re.compile('stdout_logfile=(.*)[\n|$]?')
            plogs=plogre.findall(out)

            for i in range(len(pnames)):
                code1, out = ssh.exec_command_raw(getstat_comm+pnames[i])
                status = 0
                if code1 !=0:
                    getstat_comm = 'sudo supervisorctl -c ' + proj.supervisor_confdir.replace('supervisord.d/', 'supervisord.conf') \
                                   + ' status '
                    code1, out = ssh.exec_command_raw(getstat_comm + pnames[i])
                if code1 == 0:
                    if 'RUNNING' in out:
                        status=1
                    elif 'STOPPED'in out:
                        status = 0
                    else:
                        status = 2
                dict1=dict(project_id=project_id, supervisor_name=pnames[i],updated_at=human_datetime(),
                             command=pcommands[i], log_path=plogs[i], status=status)
                response.append(dict1)
                if not queue.objects.filter(project_id=project_id,supervisor_name=pnames[i]).exists():
                    queue.objects.create(**dict1)

def flushque(project_id):
    recs = queue.objects.filter(project_id=project_id)
    proj = project1.objects.get(pk=project_id)
    host1 = Host.objects.filter(hostname=proj.supervisor_host).first()
    if 'conf.d' in proj.supervisor_confdir:
        getstat_comm = 'sudo supervisorctl -c ' + proj.supervisor_confdir.replace('conf.d/', 'supervisord.conf') \
                   + ' status '
    else:
        getstat_comm = 'sudo supervisorctl -c ' \
                       + proj.supervisor_confdir.replace('supervisord.d/', 'supervisord.conf') + ' status '
    ssh = host1.get_ssh()
    with ssh:
        for item in recs:
            code1, out = ssh.exec_command_raw(getstat_comm + item.supervisor_name)
            if code1 == 0:
                if 'RUNNING' in out:
                    status=1
                elif 'STOPPED'in out:
                    status = 0
                else:
                    status = 2
            queue.objects.filter(pk=item.id).update(status=status,updated_at=human_datetime())

def optque(project_id,queue_id,opt):
    if queue.objects.filter(project_id=project_id).exists():
        rec1 = queue.objects.get(pk=queue_id)
        proj = project1.objects.get(pk=project_id)
        host1 = Host.objects.filter(hostname=proj.supervisor_host).first()
        queopt_comm = 'sudo supervisorctl -c ' + proj.supervisor_confdir.replace('conf.d/', 'supervisord.conf') \
                      +' '+ opt + ' ' + rec1.supervisor_name
        with SSH(proj.supervisor_host, host1.port, host1.username, host1.pkey) as ssh:
            code1, out = ssh.exec_command_raw(queopt_comm)
        return code1
