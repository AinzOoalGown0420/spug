
 import { observable, computed } from 'mobx';
 import { message } from 'antd';
 import { http, includes } from 'libs';
 import lds from 'lodash';
 
 class Store {
   counter = {};
   @observable records = null;
   @observable projid = null;
   @observable treeData = [];
   @observable queuedata = [];
   @observable updatelog = [];
   @observable groups = {};
   @observable update_info = {};
   @observable group = {};
   @observable record = {};
   @observable filelist = {};
   @observable idMap = {};
   @observable addByCopy = true;
   @observable grpFetching = true;
   @observable isFetching = false;
   @observable queisFetching = false;
   @observable listloading = false;
   @observable formVisible = false;
   @observable logVisible = false;
   @observable importVisible = false;
   @observable syncVisible = false;
   @observable cloudImport = null;
   @observable detailVisible = false;
   @observable selectorVisible = false;

   @observable l_word;
   @observable f_word;
   @observable f_status = '';

   @computed get queuedata1() {
    let queuedata = this.queuedata;
    if (this.f_word) queuedata = queuedata.filter(x => includes(x.supervisor_name, this.f_word) || includes(x.command, this.f_word));
    return queuedata
  }

  @computed get gitlog() {
    let updatelog = this.updatelog;
    if (this.l_word) updatelog = updatelog.filter(x => includes(x.content, this.l_word) || includes(x.username, this.l_word) || includes(x.code_files, this.l_word));
    return updatelog
  }

   fetchprojects = () => {
     this.grpFetching = true;
     return http.get('/api/projectM/')
       .then(res => {
        this.groups = res.groups;
        this.refreshCounter(res.treeData);
       })
       .finally(() => this.grpFetching = false)
   }
 
   fetchqueue = (key=this.group.key) => {
    this.grpFetching = true;
    const form = {project_id:key}
    return http.get('/api/projectM/queue/',{params:form})
      .then(res => {
       this.queuedata = res.quedata;
      })
      .finally(() => this.grpFetching = false)
  }

  fetchlog = (key=this.group.key) => {
    this.grpFetching = true;
    const form = {project_id:key}
    return http.get('/api/projectM/update_log/',{params:form})
      .then(res => {
        this.updatelog = res.update_log;
      })
      .finally(() => this.grpFetching = false)
  }

  getfilelist = (key=this.group.key) => {
    this.grpFetching = true;
    const form = {project_id:key}
    return http.get('/api/projectM/getfilelist/',{params:form})
      .then(res => {
        this.filelist = res;
      })
      .finally(() => {this.grpFetching = false;this.listloading = false;})
  }

  readque = () => {
    this.queisFetching = true;
    const form = {project_id:this.group.key}
    return http.get('/api/projectM/queue/readque/',{params:form})
      .then(res => {
       this.queuedata = res.quedata;
      })
      .finally(() => this.queisFetching = false)
  }

  queflush = () => {
    this.queisFetching = true;
    const form = {project_id:this.group.key}
    return http.get('/api/projectM/queue/queflush/',{params:form})
      .then(res => {
       this.queuedata = res.quedata;
      })
      .finally(() => this.queisFetching = false)
  }

  queueopt = (info,queopt) => {
    this.grpFetching = true;
    const form = {project_id:this.group.key,queue_id:info.id,opt:queopt}
    return http.get('/api/projectM/queue/queueopt/',{params:form})
      .then(res => {
       this.queuedata = res.quedata;
      })
      .finally(() => this.grpFetching = false)
  }

  queuedel = (info) => {
    this.grpFetching = true;
    const form = {project_id:this.group.key,queue_id:info.id,supervisor_name:info.supervisor_name}
    return http.delete('/api/projectM/queue/delque/',{params:form})
      .then(res => {
       this.queuedata = res.quedata;
      })
      .finally(() => this.grpFetching = false)
  }

   initial = () => {
     this.isFetching = true;
     this.grpFetching = true;
     this.listloading = true;
     const form = {project_id:1}
     return http.all([http.get('/api/host/'),http.get('/api/projectM/'),http.get('/api/projectM/queue/',{params:form}),
     http.get('/api/projectM/update_log/',{params:form}),http.get('/api/projectM/getfilelist/',{params:form}),])
       .then(http.spread((res1, res2, res3, res4, res5) => {
         this.records = res1;
         this.records.map(item => this.idMap[item.id] = item);
         this.group = res2.treeData[0] || {};
         this.groups = res2.groups;
         this._makeCounter();
         this.refreshCounter(res2.treeData);
         this.queuedata = res3.quedata;
         this.updatelog = res4.update_log;
         this.filelist = res5;
       }))
       .finally(() => {
         this.isFetching = false;
         this.grpFetching = false;
         this.listloading = false;
       })
   }
 
   updateGroup = (group, host_ids) => {
     const form = {host_ids, s_group_id: group.key, t_group_id: this.group.key, is_copy: this.addByCopy};
     return http.patch('/api/host/', form)
       .then(() => {
         message.success('操作成功');
         this.fetchRecords()
       })
   }
 
   showForm = (info = {}) => {
     this.formVisible = true;
     this.record = info
   }
 
   showSync = () => {
     this.syncVisible = !this.syncVisible
   }
 
   showDetail = (info) => {
     this.record = info;
     this.detailVisible = true;
   }
 
   showSelector = (addByCopy) => {
     this.addByCopy = addByCopy;
     this.selectorVisible = true;
   }
 
   refreshCounter = (treeData) => {
     treeData = treeData || lds.cloneDeep(this.treeData);
     if (treeData.length) {
       for (let item of treeData) {
         this._refreshCounter(item)
       }
       this.treeData = treeData
     }
   }
 
   _refreshCounter = (item) => {
     item.all_host_ids = item.self_host_ids = this.counter[item.key] || [];
     for (let child of item.children) {
       const ids = this._refreshCounter(child)
       item.all_host_ids = item.all_host_ids.concat(ids)
     }
     item.all_host_ids = Array.from(new Set(item.all_host_ids));
     if (this.group.key === item.key) this.group = item;
     return item.all_host_ids
   }
 
   _makeCounter = () => {
     const counter = {};
     for (let host of this.records) {
       for (let id of host.group_ids) {
         if (counter[id]) {
           counter[id].push(host.id)
         } else {
           counter[id] = [host.id]
         }
       }
     }
     this.counter = counter
   }
 }
 
 export default new Store()
 