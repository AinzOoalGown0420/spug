import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Collapse, List, Skeleton, Input, Button } from 'antd';
import store from './store';
import { http } from 'libs';

export default observer(function () { 
    const { Panel } = Collapse;
    const { Search } = Input;

    const handledown=(filename,path=null,key=store.group.key)=>{
        const form = {project_id:key,}
        if (path.constructor!==String){
            path=null
        }
        form['filepath']=path?String(path)+String(filename):filename
        console.log(filename)
        return http.get('/api/projectM/donwload/',{params:form})
      .then(res => {
        //document.write(JSON.stringify(res))
        var inValue = JSON.stringify(res);
        var inValue = inValue.replace(/\\n/g,'\n');
        var blob = new Blob([inValue], {
        type: "text/plain;charset=utf-8",
        endings:'native'
         });
         const fileName = filename
        if ("msSaveOorOpenBlob" in navigator) {
        //IE 浏览器
         window.navigator.msSaveOorOpenBlob(blob, fileName);
        } else {
        //不是IE浏览器
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.setAttribute("download", fileName)
        link.click();
        }
      })
      .finally(() => {store.grpFetching = false;store.listloading = false;})
    }
    return (
        <div>
      <Search 
        placeholder="例：/app/frontend/runtime/logs/app2022-07-07.log" 
        allowClear
      enterButton="下载" 
      onSearch={handledown}
      style={{ width: 'calc(50%)', }}
    />
        <Collapse defaultActiveKey={['1']} style={{ width: 'calc(50%)', }}>
            {store.filelist && store.filelist.hasOwnProperty('frontend') && 
            <Panel header="前台日志" key="1">
                <List className="demo-loadmore-list" loading={store.listloading} itemLayout="horizontal" 
                dataSource={store.filelist.frontend} renderItem={(item) => (
                <List.Item actions={[<a key="list-loadmore-edit" onClick={()=>handledown(item,'/app/frontend/runtime/logs/')} >下载</a>]}>
                <Skeleton avatar title={false} loading={item.loading} active>
                <List.Item.Meta description={item}/>
                </Skeleton>
                </List.Item>
                )}/>
            </Panel>}
            {store.filelist && store.filelist.hasOwnProperty('backend') && 
            <Panel header="后台日志" key="2">
                <List className="demo-loadmore-list" loading={store.listloading} itemLayout="horizontal" 
                dataSource={store.filelist.backend} renderItem={(item) => (
                <List.Item actions={[<a key="list-loadmore-edit"  onClick={()=>handledown(item,'/app/backend/runtime/logs/')} >下载</a>]}>
                <Skeleton avatar title={false} loading={item.loading} active>
                <List.Item.Meta description={item}/>
                </Skeleton>
                </List.Item>
                )}/>
            </Panel>}
            {store.filelist && store.filelist.hasOwnProperty('console') && 
            <Panel header="队列日志" key="3">
                <List className="demo-loadmore-list" loading={store.listloading} itemLayout="horizontal" 
                dataSource={store.filelist.console} renderItem={(item) => (
                <List.Item actions={[<a key="list-loadmore-edit"  onClick={()=>handledown(item,'/app/console/runtime/logs/')} >下载</a>]}>
                <Skeleton avatar title={false} loading={item.loading} active>
                <List.Item.Meta description={item}/>
                </Skeleton>
                </List.Item>
                )}/>
                
            </Panel>}
        </Collapse>
        </div>
    )
})