from apps.projectM.models import project1
from libs.ssh import SSH
from apps.host.models import Host
from libs import json_response
import tempfile
from django.http import StreamingHttpResponse



def get_filelist(request):
    project_id = request.GET.get('project_id')
    proj = project1.objects.get(id=project_id)
    if Host.objects.filter(hostname=proj.supervisor_host).exists():
        host1 = Host.objects.filter(hostname=proj.supervisor_host).first()
        front_comm = 'sudo ls '+ proj.code_path + '/app/frontend/runtime/logs/'
        backend_comm = 'sudo ls '+ proj.code_path + '/app/backend/runtime/logs/'
        console_comm = 'sudo ls '+ proj.code_path + '/app/console/runtime/logs/'
        response={}
        ssh = host1.get_ssh()
        with ssh:
            frontend_code, frontend_out = ssh.exec_command_raw(front_comm)
            backend_code, backend_out = ssh.exec_command_raw(backend_comm)
            console_code, console_out = ssh.exec_command_raw(console_comm)
            if frontend_code == 0:
                response['frontend']=frontend_out.split('\n')
            if backend_code == 0:
                response['backend']=backend_out.split('\n')
            if console_code == 0:
                response['console']=console_out.split('\n')
            return json_response(response)
        return json_response(None)

def donwload_file(request):
    project_id = request.GET.get('project_id')
    filepath = request.GET.get('filepath')
    proj = project1.objects.get(pk=project_id)
    host1 = Host.objects.filter(hostname=proj.supervisor_host).first()
    filename = filepath.split('/')[-1]
    comm = 'sudo cat '+proj.code_path+filepath
    ssh = host1.get_ssh()
    with ssh:
        code,out=ssh.exec_command_raw(comm)
        def down_chunk_file_manager(fstr, chuck_size=1024):
            with tempfile.TemporaryFile(mode="w+") as file1:
                fstr=fstr.replace('\\n', '\n')
                file1.write(fstr)
                file1.seek(0)
                while True:
                    chuck_stream = file1.read(chuck_size)
                    if chuck_stream:
                        yield chuck_stream
                    else:
                        break
        if code==0:
            response = StreamingHttpResponse(down_chunk_file_manager(out))
            response['Content-Type'] = 'application/octet-stream'
            response['Content-Disposition'] = 'attachment;filename="{0}"'.format(filename)
            return response
