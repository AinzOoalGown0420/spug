import { Card } from 'antd';
import React, { useState } from 'react';
import { observer } from 'mobx-react';
import InfoForm from './Form';
import QueTable from './queue';
import Update from './updateC';
import Update_log from './update_log';
import Download from './download';
import store from './store';
import styles from './index.module.less';

  const tabListNoTitle = [
    {
      key: 'projectInfo',
      tab: '项目信息',
    },
    {
      key: 'queue',
      tab: '队列',
    },
    {
      key: 'update_code',
      tab: '代码更新',
    },
    {
      key: 'update_log',
      tab: '更新历史',
    },
    {
      key: 'donwload_file',
      tab: '站点文件下载',
    },
  ];
  const contentListNoTitle = {
    projectInfo: <InfoForm/>,
    queue: <QueTable/>,
    update_code:<Update/>,
    update_log:<Update_log/>,
    donwload_file:<Download/>,
  };
  
  function Tabcard() {
    const [activeTabKey, setActiveTabKey] = useState('projectInfo');
  
    const onTabChange = (key) => {
      setActiveTabKey(key);
    };
  
    return (
      <>
        <Card
          style={{
            width: '100%',
          }}
          tabList={tabListNoTitle}
          activeTabKey={activeTabKey}
          loading={store.listloading}
          onTabChange={(key) => {
            onTabChange(key);
          }}
        >
          {contentListNoTitle[activeTabKey]}
        </Card>
      </>
    );
  };

export default observer(Tabcard)
