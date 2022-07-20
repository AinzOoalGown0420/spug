import React , { useState } from 'react';
import { observer } from 'mobx-react';
import { Table, Input, Tooltip } from 'antd';
import { Action, TableCard, AuthButton } from 'components';
import {  SyncOutlined } from '@ant-design/icons';
import store from './store';
import UpcodeInfo from './upcodeInfo';
import { QuestionCircleOutlined } from '@ant-design/icons';

function LogTable() {
    const showinfo = (info) =>{
        store.update_info = info;
        store.logVisible = true;
        console.log(store.update_info);
        console.log(store.logVisible);
    }
    return (
        <TableCard
       tKey="hi"
       rowKey="id"
       title={<div><Input placeholder="输入检索" style={{maxWidth: 250}} onChange={e => store.l_word = e.target.value}/>
       <Tooltip title="仅检索更新内容、操作人、更新文件。"><QuestionCircleOutlined style={{marginLeft: 8, color: '#999'}}/></Tooltip></div>}
       loading={store.queisFetching}
       dataSource={store.gitlog}
       onReload={store.fetchlog}
       scroll={{x: 800}}
       pagination={{
         showSizeChanger: true,
         showLessItems: true,
         hideOnSinglePage: true,
         showTotal: total => `共 ${total} 条`,
         pageSizeOptions: ['10', '20', '50', '100']
       }}>
       <Table.Column title="更新内容" render={info => (
         <div>{info.content}</div>
       )}/>
       <Table.Column title="更新版本" render={info => (
         <div><p>更新前版本：{info.previous_ver}</p>
         <p>更新后版本：{info.later_ver}</p></div>
       )}/>
       <Table.Column title="冲突文件" render={info => (
         <div>{info.conflict_files}</div>
       )}/>
       <Table.Column title="操作人" render={info => (
         <div>{info.username}</div>
       )}/>
       <Table.Column title="更新时间" render={info => (
         <div>{info.update_at}</div>
       )}/>
       {(<Table.Column render={(info) => (
             <Action.Button onClick={()=>showinfo(info)}>详细信息</Action.Button>
           )}/>)}
     </TableCard>
      )
    }
    
    export default observer(LogTable)