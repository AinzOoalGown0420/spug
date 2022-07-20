 import React , { useState } from 'react';
 import { observer } from 'mobx-react';
 import { Table, Modal,  Button,  Tag, Radio, Input, message, Tooltip } from 'antd';
 import {  SyncOutlined } from '@ant-design/icons';
 import { Action, TableCard, AuthButton } from 'components';
 import { http, hasPermission } from 'libs';
 import store from './store';
 import QueueFrom from './queueFrom';
 import { QuestionCircleOutlined } from '@ant-design/icons';
 import styles from './index.module.less';

 function QueTable() {

  const showqueueFrom = () => {
    store.formVisible = true;
  };
   function handleDelete(text) {
     Modal.confirm({
       title: '删除确认',
       content: `确定要删除【${text['name']}】?`,
       onOk: () => {
         return http.delete('/api/host/', {params: {id: text.id}})
           .then(() => {
             message.success('删除成功');
             store.fetchRecords()
           })
       }
     })
   }
   
   function getstatus(status){
    if (status==0){
      return <Tag color="orange">已停止</Tag>
    }else if (status==1){
      return <Tag color="green">运行中</Tag>
    }else{
      return <Tag color="red">未知</Tag>
    }
   }
 
 
   return (
     <TableCard
        className={styles.scro}
       tKey="hi"
       rowKey="id"
       title={<div><Input placeholder="输入检索" style={{maxWidth: 250}} onChange={e => store.f_word = e.target.value}/>
       <Tooltip title="仅检索进程名，执行命令。"><QuestionCircleOutlined style={{marginLeft: 8, color: '#999'}}/></Tooltip></div>}
       loading={store.queisFetching}
       dataSource={store.queuedata1}
       onReload={store.fetchqueue}
       scroll={{x: 800,y:600}}
       actions={[
        <Button type="primary" onClick={showqueueFrom}>新增队列</Button>,
        <QueueFrom/>,
             <Button type="primary" onClick={() => store.readque()}>读取队列</Button>,
         <AuthButton
           auth="host.host.add"
           type="primary"
           icon={<SyncOutlined/>}
           onClick={() => store.queflush()}>刷新</AuthButton>,
         <Radio.Group value={store.f_status} onChange={e => store.f_status = e.target.value}>
           <Radio.Button value="">全部</Radio.Button>
           <Radio.Button value={false}>未验证</Radio.Button>
         </Radio.Group>
       ]}
       pagination={{
         showSizeChanger: true,
         showLessItems: true,
         hideOnSinglePage: true,
         showTotal: total => `共 ${total} 条`,
         pageSizeOptions: ['10', '20', '50', '100']
       }}>
       <Table.Column title="队列名" render={info => (
         <div>{info.supervisor_name}</div>
       )}/>
       <Table.Column title="命令" render={info => (
         <div>{info.command}</div>
       )}/>
       <Table.Column title="队列日志" render={info => (
         <div>{info.log_path}</div>
       )}/>
       <Table.Column title="更新时间" render={info => (
         <div>{info.updated_at}</div>
       )}/>
       <Table.Column
         title="状态"
         dataIndex="status"
         render={getstatus}/>
       {hasPermission('project.queue.edit|project.queue.del') && (
         <Table.Column width={160} title="操作" render={info => (
           <Action>
             <Action.Button auth="hproject.queue.edit" onClick={() => store.queueopt(info,'start')}>启动</Action.Button>
             <Action.Button auth="project.queue.edit" onClick={() => store.queueopt(info,'stop')}>停止</Action.Button>
             <Action.Button danger auth="project.queue.edit" onClick={() =>  store.queueopt(info,'restart')}>重启</Action.Button>
             <Action.Button danger auth="project.queue.del" onClick={() =>  store.queuedel(info,'restart')}>删除</Action.Button>
           </Action>
           )}/>
           )}
     </TableCard>
   )
 }
 
 export default observer(QueTable)
 