from libs.ssh import SSH
from apps.projectM.models import project1
from apps.host.models import Host
import re
from libs.sshforward import agentssh, _agent_sync_host_extend

def git_pull(project_id,option):
    proj = project1.objects.get(pk=project_id)
    host1 = Host.objects.get(hostname=proj.supervisor_host)
    get_ver='sudo sh -c \'cd '+proj.code_path+' && git rev-list HEAD -n 1\''
    comm='sudo sh -c \'cd '+proj.code_path+' && git pull && sh ~/git_build_version.sh\''
    ssh = host1.get_ssh()
    with ssh:
        code, pre_ver = ssh.exec_command_raw(get_ver)
        code, out = ssh.exec_command_raw(comm)
        code1, later_ver = ssh.exec_command_raw(get_ver)
        conflict_list=[]
        update_list=[]
        if code == 0:
            if 'Already up to date' in out:
                update_list=['Already up to date.']
            else:
                updatef_re = re.compile("[\s]+(.*)[\s|\t]+\|")
                update_list = updatef_re.findall(out)
                update_list = [i.rstrip(' ') for i in update_list]
        else:
            conflictre = re.compile("[\t]+(.*)\n")
            conflict_list = conflictre.findall(out)
            if option == 'stop':
                pass
            else:
                for fname in conflict_list:
                    mvcomm = 'sudo mv -f ' + proj.code_path +'/'+ fname +' '+ proj.code_path+'/'+fname + '.bak'
                    code, out = ssh.exec_command_raw(mvcomm)
                code, out = ssh.exec_command_raw(comm)
                code1, later_ver = ssh.exec_command_raw(get_ver)
                if code == 0:
                    updatef_re = re.compile("[\s]+(.*)[\s|\t]+\|")
                    update_list = updatef_re.findall(out)
                    update_list = [i.rstrip(' ') for i in update_list]
                    if option == 'old_file':
                        for fname in conflict_list:
                            mvcomm = 'sudo mv -f ' + proj.code_path +'/'+ fname +'.bak'+' '+ proj.code_path +'/'+ fname
                            code, out = ssh.exec_command_raw(mvcomm)
                else:
                    return out
        response=dict(conflict_files='\n'.join(conflict_list),code_files='\n'.join(update_list),
                      previous_ver=pre_ver,later_ver=later_ver)
        return response

def db_opt(project_id,sql_comm):
    proj = project1.objects.get(pk=project_id)
    db_host = Host.objects.get(hostname=proj.db_addr)
    tmpsqlf='/tmp/tmpsqlf.sql'
    mksqlf='cat > ' + tmpsqlf + '<<EOF\n' + sql_comm + '\nEOF'
    comm='mysql -h127.0.0.1 -u'+db_host.db_user+' -p'+db_host.db_passwd+' -D'+proj.db_name+' -e \'source '+tmpsqlf+'\''
    if db_host.is_forward==1:
        with agentssh(db_host.agent_ip, db_host.hostname, db_host.port, db_host.username, db_host.pkey) as ssh:
            code1, out1 = ssh.exec_command_raw(mksqlf)
            if code1==0:
                code, out = ssh.exec_command_raw(comm)
    else:
        with SSH(proj.supervisor_host, db_host.port, db_host.username, db_host.pkey) as ssh:
            code1, out1 = ssh.exec_command_raw(mksqlf)
            if code1==0:
                code, out = ssh.exec_command_raw(comm)
    return out

