from django.db import models
from libs import ModelMixin, human_datetime
from apps.host.models import Host
from libs.sqlc import sqlc
from apps.account.models import User

class queue(models.Model, ModelMixin):
    project_id = models.IntegerField(default=0)
    supervisor_name = models.CharField(max_length=255)
    command = models.CharField(max_length=255)
    log_path = models.CharField(max_length=255)
    status = models.IntegerField(default=0)
    updated_at = models.CharField(max_length=20, default=human_datetime)
    def to_view(self):
        response = dict(id=self.pk,project_id=self.project_id,supervisor_name=self.supervisor_name,
                        command=self.command,log_path=self.log_path,status=self.status,
                        updated_at=self.updated_at)
        return response
    class Meta:
        db_table = 'projectsM_queue'
        #ordering = ('-supervisor_name')

class cron(models.Model, ModelMixin):
    project_id = models.IntegerField(default=0)
    cron_time = models.CharField(max_length=255)
    command = models.CharField(max_length=255)
    class Meta:
        db_table = 'project_crontab'

class git_log(models.Model, ModelMixin):
    project_id = models.IntegerField(default=0)
    previous_ver = models.CharField(max_length=255)
    later_ver = models.CharField(max_length=255)
    content = models.CharField(max_length=255)
    code_files = models.TextField()
    option = models.CharField(max_length=20)
    conflict_files = models.TextField()
    db_opt = models.TextField()
    db_result = models.TextField()
    cron = models.CharField(max_length=255)
    queue_opt = models.CharField(max_length=255)
    opt_person = models.IntegerField(default=0)
    update_at = models.CharField(max_length=20, default=human_datetime)

    def to_view(self):
        username = User.objects.get(pk=self.opt_person).username
        response = self.to_dict()
        response['username']=username
        return response

    class Meta:
        db_table = 'git_update_log'

class project1(models.Model, ModelMixin):
    name = models.CharField(max_length=20)
    parent_id = models.IntegerField(default=0)
    sort_id = models.IntegerField(default=0)
    code_path = models.CharField(max_length=255)
    supervisor_host = models.CharField(max_length=255)
    supervisor_confdir = models.CharField(max_length=255)
    git_url = models.CharField(max_length=255)
    db_addr = models.CharField(max_length=50)
    db_name = models.CharField(max_length=255)
    queue = models.ManyToManyField(queue, related_name='project_id_queue')
    cron = models.ManyToManyField(cron, related_name='cron_project_id')
    git_log = models.ManyToManyField(git_log, related_name='proj_git')

    def to_view(self, with_hosts=False):
        response = dict(key=self.id, value=self.id, title=self.name,
                        name=self.name, code_path=self.code_path, supervisor_host=self.supervisor_host,
                        supervisor_confdir=self.supervisor_confdir, git_url=self.git_url,
                        db_addr=self.db_addr,db_name=self.db_name,
                        queue=[], cron=[], children=[])
        if with_hosts:
            def make_queueitem(x):
                return dict(title=x.supervisor_name, command=x.command, log=x.log_path, status=x.status)
            def make_cronitem(x):
                return dict(title=x.supervisor_name, command=x.command, log=x.log_path, status=x.status)
            response['queue'] = [make_queueitem(x) for x in self.queue.all()]
            response['cron'] = [make_cronitem(x) for x in self.cron.all()]
        return response

    class Meta:
        db_table = 'projectsM'
        #ordering = ('-sort_id')

class project2(sqlc):

        fieldlist=['id','name','parent_id','sort_id','code_path','supervisor_host',
                   'supervisor_confdir','git_url','db_addr','db_name']
        tablename='projectsM'

        def to_view(self,projectrec, with_hosts=False):
            response = dict(key=projectrec['id'], value=projectrec['id'], title=projectrec['name'],
                            name=projectrec['name'], code_path=projectrec['code_path'],
                            supervisor_host=projectrec['supervisor_host'],supervisor_confdir=projectrec['supervisor_confdir'],
                            git_url=projectrec['git_url'],db_addr=projectrec['db_addr'],db_name=projectrec['db_name'],
                            children=[])
            if with_hosts:
                def make_item(x):
                    return dict(title=x.supervisor_name, command=x.command, log=x.log_path, status=x.status)

                response['queue'] = [make_item(x) for x in self.queue.all()]

            return response