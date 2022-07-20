from django.views.generic import View
from apps.projectM.models import project1,project2,git_log
from apps.account.models import User
from apps.projectM.update_code import git_pull,db_opt
from libs import json_response, auth, JsonParser, Argument
from libs import human_datetime


def filter_by_perm(data, result, ids):
    for item in data:
        if 'queue' in item:
            if item['key'] in ids:
                result.append(item)
            elif item['queue']:
                filter_by_perm(item['queue'], result, ids)


def fetch_children(p2,data, with_hosts):
    if data:
        sub_data = dict()
        for item in p2.fileterin('parent_id',str(list(data.keys()))[1:-1]):
            tmp = p2.to_view(item,with_hosts)
            sub_data[item["id"]] = tmp
            data[item["parent_id"]]['children'].append(tmp)
        return fetch_children(p2,sub_data, with_hosts)

def merge_children(data, prefix, childes):
    prefix = f'{prefix}/' if prefix else ''
    for item in childes:
        name = f'{prefix}{item["title"]}'
        item['name'] = name
        if item.get('children'):
            merge_children(data, name, item['children'])
        else:
            data[item['key']] = name

class projectView(View):
    @auth('project.projectM.view')
    def get(self, request):
        with_hosts = request.GET.get('with_hosts')
        data, data2 = dict(), dict()
        p2=project2()
        for item in p2.recfileter('parent_id','0'):
            data[item['id']] = p2.to_view(item,with_hosts)
        fetch_children(p2,data, with_hosts)
        if not data:
            grp = project1.objects.create(name='Default', sort_id=1)
            data[grp.id] = grp.to_view()
        #if request.user.is_supper:
        tree_data = list(data.values())
      #  else:
      #      tree_data, ids = [], request.user.group_perms
      #      filter_by_perm(data.values(), tree_data, ids)
        merge_children(data2, '', tree_data)
        return json_response({'treeData': tree_data, 'groups': data2})

    @auth('admin')
    def post(self, request):
        form, error = JsonParser(
            Argument('id', type=int, required=False),
            Argument('parent_id', type=int, default=0),
            Argument('name', help='请输入分组名称')
        ).parse(request.body)
        if error is None:
            if form.id:
                project1.objects.filter(pk=form.id).update(name=form.name)
            else:
                group = project1.objects.create(**form)
                group.sort_id = group.id
                group.save()
        return json_response(error=error)

    @auth('admin')
    def patch(self, request):
        form, error = JsonParser(
            Argument('s_id', type=int, help='参数错误'),
            Argument('d_id', type=int, help='参数错误'),
            Argument('action', type=int, help='参数错误')
        ).parse(request.body)
        if error is None:
            src = project1.objects.get(pk=form.s_id)
            dst = project1.objects.get(pk=form.d_id)
            if form.action == 0:
                src.parent_id = dst.id
                dst = project1.objects.filter(parent_id=dst.id).first()
                if not dst:
                    src.save()
                    return json_response()
                form.action = -1
            src.parent_id = dst.parent_id
            if src.sort_id > dst.sort_id:
                if form.action == -1:
                    dst = project1.objects.filter(sort_id__gt=dst.sort_id).last()
                project1.objects.filter(sort_id__lt=src.sort_id, sort_id__gte=dst.sort_id).update(sort_id=F('sort_id') + 1)
            else:
                if form.action == 1:
                    dst = project1.objects.filter(sort_id__lt=dst.sort_id).first()
                project1.objects.filter(sort_id__lte=dst.sort_id, sort_id__gt=src.sort_id).update(sort_id=F('sort_id') - 1)
            src.sort_id = dst.sort_id
            src.save()
        return json_response(error=error)

    @auth('admin')
    def delete(self, request):
        form, error = JsonParser(
            Argument('id', type=int, help='参数错误')
        ).parse(request.GET)
        if error is None:
            #group = project1.objects.filter(pk=form.id).first()
            p2=project2()
            group = p2.recfileter('id',str(form.id))[0]
            if not group:
                return json_response(error='未找到指定分组')
            #if project1.objects.filter(parent_id=group.id).exists():
            if p2.recfileter('parent_id',str(group['id'])):
                return json_response(error='请移除子分组后再尝试删除')
            #if group.hosts.exists():
            #if group['hosts']:
            #    return json_response(error='请移除分组下的主机后再尝试删除')
            #if not project1.objects.exclude(pk=form.id).exists():
             #   return json_response(error='请至少保留一个分组')
            #role = project1.objects.filter(group_perms__regex=fr'[^0-9]{form.id}[^0-9]').first()
            #if role:
            #    return json_response(error=f'账户角色【{role.name}】的主机权限关联该分组，请解除关联后再尝试删除')
            #group.delete()
            p2.deleterec('id',str(form.id))
        return json_response(error=error)

@auth('admin')
def updateInfo(request):
    form, error = JsonParser(
        Argument('id', type=int, required=False),
        Argument('name', help='请输入项目名称'),
        Argument('code_path', required=False),
        Argument('supervisor_host', required=False),
        Argument('supervisor_confdir', required=False),
        Argument('git_url', required=False),
        Argument('db_addr', required=False),
        Argument('db_name', required=False),
    ).parse(request.body)
    if error is None:
        project1.objects.filter(pk=form.id).update(**form)
    return json_response(error=error)

def updateC(request):
    form, error = JsonParser(
        Argument('project_id', help='请输入项目id'),
        Argument('content', help='请输入更新内容'),
        Argument('option', help='请选择文件冲突时所作的操作'),
        Argument('db_opt', required=False),
        Argument('cron', required=False),
    ).parse(request.body)
    if error is None:
        response=git_pull(form.project_id,form.option)
        response.update(form)
        token=request.META.get('HTTP_X_TOKEN')
        user1 = User.objects.get(access_token=token)
        response['opt_person']=user1.id
        response['update_at'] = human_datetime()
        if form.db_opt:
            response['db_result']=db_opt(form.project_id,form.db_opt)
        git_log1 = git_log.objects.create(**response)
        git_log1.save()
        response['username'] = user1.username
        return json_response(response)
    else:
        return json_response(error=error)

def update_log(request):
    project_id = request.GET.get('project_id')
    log_list=git_log.objects.filter(project_id=project_id)
    response=[item.to_view() for item in log_list]
    return json_response({'update_log':response})