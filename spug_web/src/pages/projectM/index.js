import React, { useEffect, componentWillmount } from 'react';
import { observer } from 'mobx-react';
import { AuthDiv, Breadcrumb } from 'components';
import { Row, Col } from 'antd';
import Tabcard from './tabcard';
import Project1 from './projectM1';
import store from './store';
import Selector from './Selector';
import UpcodeInfo from './upcodeInfo';

export default observer(function () {

  useEffect(() => {
    store.initial()
  }, [])
  
  return (
      <AuthDiv auth="project.projectM.view">
        <Breadcrumb>
          <Breadcrumb.Item>首页</Breadcrumb.Item>
          <Breadcrumb.Item>项目管理</Breadcrumb.Item>
        </Breadcrumb>
      
      <Row gutter={12}>
      <Col span={5}>
        <Project1/>
      </Col>
      <Col span={19}>
          <Tabcard/>
      </Col>
    </Row>
    {store.selectorVisible &&
        <Selector oneGroup={!store.addByCopy} onCancel={() => store.selectorVisible = false} onOk={store.updateGroup}/>}
    <UpcodeInfo/>
    </AuthDiv>
    )
})