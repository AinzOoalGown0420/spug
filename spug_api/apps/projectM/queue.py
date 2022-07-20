from django.views.generic import View
from apps.projectM.models import project1,queue
from apps.projectM.supervisor import *
from libs import json_response, auth, JsonParser, Argument

class queueView(View):
    def get(self, request):
        project_id = request.GET.get('project_id')
        try:
            if queue.objects.filter(project_id=project_id).exists():
                rec1 = queue.objects.filter(project_id=project_id)
                print(rec1)
                response=[]
                for item in rec1:
                    iteminfo=item.to_view()
                    response.append(iteminfo)
                return json_response({"quedata":response})
            return json_response({"quedata":[]})
        except:
            return json_response({"quedata":[]})

def queflush(request):
    project_id=request.GET.get('project_id')
    flushque(project_id)
    if queue.objects.filter(project_id=project_id).exists():
        rec1 = queue.objects.filter(project_id=project_id)
        response = []
        for item in rec1:
            iteminfo = item.to_view()
            response.append(iteminfo)
        return json_response({"quedata": response})
    return None

def readque(request):
    project_id = request.GET.get('project_id')
    fetch_queue(project_id)
    try:
        if queue.objects.filter(project_id=project_id).exists():
            rec1 = queue.objects.filter(project_id=project_id)
            response = []
            for item in rec1:
                iteminfo = item.to_view()
                response.append(iteminfo)
            return json_response({"quedata": response})
        return json_response({"quedata": []})
    except:
        return json_response({"quedata": []})

def queueopt(request):
    project_id = request.GET.get('project_id')
    queue_id = request.GET.get('queue_id')
    opt = request.GET.get('opt')
    code1=optque(project_id,queue_id,opt)
    if code1 == 0:
        if queue.objects.filter(project_id=project_id).exists():
            rec1 = queue.objects.filter(project_id=project_id)
            response = []
            for item in rec1:
                iteminfo = item.to_view()
                response.append(iteminfo)
            return json_response({"quedata": response})
        return None

def addque(request):
    form, error = JsonParser(
        Argument('project_id', help='请输入项目id'),
        Argument('supervisor_name', help='请输入进程名'),
        Argument('command', help='请输入命令'),
        Argument('log_path', help='请输入日志路径'),
    ).parse(request.body)
    #project_id = request.GET.get('project_id')
    proj = project1.objects.get(pk=form.project_id)
    host1 = Host.objects.get(hostname=proj.supervisor_host)
    #supervisor_name = request.GET.get('supervisor_name')
    #command = request.GET.get('command')
    #log_path = request.GET.get('log_path')
    from apps.projectM.supervisor_tmp import tmp_str
    add_str=tmp_str.replace('PROGRAMNAME',form.supervisor_name).replace('COMMAND',form.command).replace('LOGPATH',form.log_path)
    conf_path=proj.supervisor_confdir+proj.code_path.split('/')[-1]+'.conf'
    with SSH(proj.supervisor_host, host1.port, host1.username, host1.pkey) as ssh:
        code, out = ssh.exec_command_raw('sudo sh -c \'cat >> '+conf_path +'\'<<EOF\n'+ add_str +'\nEOF')
    if code == 0:
        dict1 = dict(project_id=form.project_id, supervisor_name=form.supervisor_name, updated_at=human_datetime(),
                     command=form.command, log_path=form.log_path, status='0')
        queue.objects.create(**dict1)
        getstat_comm = 'sudo supervisorctl -c ' + proj.supervisor_confdir.replace('conf.d/', 'supervisord.conf') \
                       + ' reload '
        with SSH(proj.supervisor_host, host1.port, host1.username, host1.pkey) as ssh:
            code1, out = ssh.exec_command_raw(getstat_comm)
        if queue.objects.filter(project_id=form.project_id).exists():
            rec1 = queue.objects.filter(project_id=form.project_id)
            response = []
            for item in rec1:
                iteminfo = item.to_view()
                response.append(iteminfo)
            return json_response({"quedata": response})
        return None

def delque(request):
    project_id = request.GET.get('project_id')
    queue_id = request.GET.get('queue_id')
    supervisor_name = request.GET.get('supervisor_name')
    # form, error = JsonParser(
    #     Argument('project_id', help='参数错误'),
    #     Argument('supervisor_name', help='参数错误'),
    #     Argument('queue_id', help='参数错误'),
    # ).parse(request.GET)
    proj = project1.objects.get(pk=project_id)
    host1 = Host.objects.get(hostname=proj.supervisor_host)
    conf_path = proj.supervisor_confdir + proj.code_path.split('/')[-1] + '.conf'
    str1='[program:'+supervisor_name+']'
    with SSH(proj.supervisor_host, host1.port, host1.username, host1.pkey) as ssh:
        code, out = ssh.exec_command_raw('cat '+conf_path)
    if code == 0:
        conf_list = out.split('\n')
        n=0
        for line in conf_list:
            if str1 in line:
                break
            n += 1
        del conf_list[n:n + 7]
        conf_str=('\n').join(conf_list)
        shcomm='sudo sh -c \'cat > ' + conf_path + '\'<<EOF\n' + conf_str + '\nEOF'
        with SSH(proj.supervisor_host, host1.port, host1.username, host1.pkey) as ssh:
            code1, out = ssh.exec_command_raw(shcomm)
        if code1 == 0:
            queue.objects.get(pk=queue_id).delete()
            getstat_comm = 'sudo supervisorctl -c ' + proj.supervisor_confdir.replace('conf.d/', 'supervisord.conf') \
                           + ' reload '
            with SSH(proj.supervisor_host, host1.port, host1.username, host1.pkey) as ssh:
                code1, out = ssh.exec_command_raw(getstat_comm)
            if queue.objects.filter(project_id=project_id).exists():
                rec1 = queue.objects.filter(project_id=project_id)
                response = []
                for item in rec1:
                    iteminfo = item.to_view()
                    response.append(iteminfo)
                return json_response({"quedata": response})
            return None