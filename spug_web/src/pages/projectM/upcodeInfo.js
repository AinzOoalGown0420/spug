import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { Modal, Collapse, Button, Skeleton  } from 'antd';
import store from './store';
import styles from './index.module.less';

export default observer(function () {
    const [loading, setLoading] = useState(false);
    const { Panel } = Collapse;
    const handleClose = () => {store.logVisible=false}
    const onChange = (key) => {
        console.log(key);
      };
    
    function getopt(){
        if (store.update_info.option=='stop'){
          return '不更新'
        }else if (store.update_info.option=='new_file'){
          return '使用新文件'
        }else if (store.update_info.option=='old_file'){
          return '使用旧文件'
        }
        else{
            return ''
        }
       }

    return (
        <Modal
          visible={store.logVisible}
          width={700}
          title={'更新信息'}
          closable={false}
          confirmLoading={loading}
          footer={<Button key="close" onClick={handleClose} type="primary" ghost>
            关闭</Button>}>
          
            <Collapse defaultActiveKey={['1']} onChange={onChange}>
                <Panel header="更新内容" key="1">
                    <p>{store.update_info.content}</p>
                </Panel>
                <Panel header="更新版本号" key="2">
                    <p>更新前版本号：{store.update_info.previous_ver}</p>
                    <p>更新后版本号：{store.update_info.later_ver}</p>
                </Panel>
                <Panel header="更新代码文件" key="3">
                    <Collapse>
                      <Panel header="更新冲突" key="1">
                        <p>更新冲突操作：{getopt()}</p>
                        <p>更新冲突文件：{store.update_info.conflict_files}</p>
                      </Panel>
                      <Panel header="更新文件" key="2">  
                        <p className={'styles.longtext'} >{store.update_info.code_files}</p>
                      </Panel>
                    </Collapse>
                </Panel>
                <Panel header="数据库操作" key="4">
                    <Collapse>
                      <Panel header="执行语句" key="1">
                        <p>{store.update_info.db_opt}</p>
                      </Panel>
                      <Panel header="执行结果" key="2"> 
                        <p>{store.update_info.db_result}</p>
                      </Panel>
                    </Collapse>
                </Panel>
                <Panel header="定时任务" key="5">
                    <p>{store.update_info.cron}</p>
                </Panel>
                <p>操作人：{store.update_info.username}</p>
                <p>更新时间：{store.update_info.update_at}</p>
            </Collapse>
        </Modal>
      )
    })