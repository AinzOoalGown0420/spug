import pymysql
from spug.overrides import DATABASES
from spug.log import LOG

class sqlc:
    db = pymysql.connect(host=DATABASES['default']['HOST'],
                         user=DATABASES['default']['USER'],
                         password=DATABASES['default']['PASSWORD'],
                         database=DATABASES['default']['NAME'])

    fieldlist = []
    tablename = ''

    def querysql(self, sql):
        LOG.debug(sql)
        self.db.connect()
        cursor = self.db.cursor()
        cursor.execute(sql)
        data = cursor.fetchall()
        self.reclist = []
        for item in data:
            self.reclist.append(dict(zip(self.fieldlist, item)))
        self.db.close()

    def delsql(self,sql):
        LOG.debug(sql)
        self.db.connect()
        cursor = self.db.cursor()
        try:
            cursor.execute(sql)
            self.db.commit()
        except:
            self.db.rollback()
            self.db.close()

    def fetchall(self):
        sql = "SELECT * FROM " + self.tablename
        self.querysql(sql)
        return self.reclist

    def recfileter(self, field, fvalue):
        sql = "SELECT * FROM " + self.tablename + " where " + field + " like '%" + fvalue + "%'"
        self.querysql(sql)
        return self.reclist

    def fileterin(self, field, instr):
        sql = "SELECT * FROM " + self.tablename + " where " + field + ' in (' + instr + ')'
        self.querysql(sql)
        return self.reclist

    def to_view(self, projectrec, with_hosts=False):
        response = dict(key=projectrec['id'], value=projectrec['id'], title=projectrec['name'], children=[])
        if with_hosts:
            def make_item(x):
                return dict(title=x.supervisor_name, command=x.command, log=x.log_path, status=x.status)

            response['queue'] = [make_item(x) for x in self.queue.all()]

        return response

    def deleterec(self,field, fvalue):
        sql = "DELETE FROM " + self.tablename + " where " + field + ' = ' + fvalue
        self.delsql(sql)