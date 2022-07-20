 import React, { useState, useEffect } from 'react';
 import { observer } from 'mobx-react';
 import { Modal, Form, Input, TreeSelect,  Alert} from 'antd';
 import { http, X_TOKEN } from 'libs';
 import store from './store';
 import styles from './index.module.less';
 
 export default observer(function () {
   const [form] = Form.useForm();
   const [loading, setLoading] = useState(false);
   const [fileList, setFileList] = useState([]);

   useEffect(() => {
     if (store.record.pkey) {
       setFileList([{uid: '0', name: '独立密钥', data: store.record.pkey}])
     }
   }, [])
 
   function handleSubmit() {
     setLoading(true);
     const formData = form.getFieldsValue();
      return http.post('/api/projectM/queue/addque/', formData)
        .then(res => {
          if (res){
            store.queuedata = res.quedata;
            store.formVisible = false;
          }
          else{
            store.formVisible = false;
          }
        })
        .finally(() => setLoading(false))}
        
   const info = store.group;
   return (
     <Modal
       visible={store.formVisible}
       width={700}
       maskClosable={false}
       title={'新建队列'}
       okText="提交"
       onCancel={() => store.formVisible = false}
       confirmLoading={loading}
       onOk={handleSubmit}>
       <Form form={form} labelCol={{span: 5}} wrapperCol={{span: 17}} initialValues={info}>
         <Form.Item required name="project_id" label="项目id">
           <TreeSelect
             treeNodeLabelProp="key"
             treeData={store.treeData}
             showCheckedStrategy={TreeSelect.SHOW_CHILD}
             placeholder="请选择分组"/>
         </Form.Item>
         <Form.Item required name="supervisor_name" label="进程名">
           <Input placeholder="不能与同服务器的进程名重复"/>
         </Form.Item>
         <Form.Item name="command" label="命令">
           <Input.TextArea placeholder="请输入主机备注信息"/>
         </Form.Item>
         <Form.Item name="log_path" label="日志路径">
             <Input placeholder="日志路径"/>
         </Form.Item>
         <Form.Item wrapperCol={{span: 17, offset: 5}}>
           <Alert showIcon type="info" message="队列名是supervisor进程管理器，用来区分不同进程的，所以需要与同服务器。"/>
         </Form.Item>
       </Form>
     </Modal>
   )
 })
 