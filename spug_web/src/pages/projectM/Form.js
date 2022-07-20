import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Button, message, Checkbox } from 'antd';
import { http, X_TOKEN } from 'libs';
import store from './store';
import styles from './index.module.less';

export default observer(function () {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [componentDisabled, setComponentDisabled] = useState(true);

  useEffect(() => {
    if (store.record.pkey) {
      setFileList([{uid: '0', name: '独立密钥', data: store.record.pkey}])
    }
  }, [])

  form.setFieldsValue({
    name: store.group.name,
    code_path: store.group.code_path,
    supervisor_host: store.group.supervisor_host,
    supervisor_confdir: store.group.supervisor_confdir,
    git_url: store.group.git_url,
    db_addr: store.group.db_addr,
    db_name: store.group.db_name,
  })

  function handleSubmit() {
    setLoading(true);
    const formData = form.getFieldsValue();
    formData['name']=formData['name'].split("/").pop()
    formData['id'] = store.group.key;
    //const file = fileList[0];
    //if (file && file.data) formData['pkey'] = file.data;
    http.post('/api/projectM/info/', formData)
      .then(res => {
        store.fetchprojects()
      }, () => setLoading(false))
  }


  const ConfirmForm = (props) => (
    <Form layout="vertical" style={{marginTop: 24}}>
      <Form.Item required label="授权密码" extra={`用户 ${props.username} 的密码， 该密码仅做首次验证使用，不会存储该密码。`}>
        <Input.Password onChange={e => props.onChange(e.target.value)}/>
      </Form.Item>
    </Form>
  )

  const onFormLayoutChange = ({ disabled }) => {
    setComponentDisabled(disabled);
  };


  //const info = store.group;
  store.group["disabled"] = componentDisabled;
  return (
      <Form form={form} labelCol={{span: 5}} wrapperCol={{span: 17}} initialValues={store.group} 
      onValuesChange={onFormLayoutChange} disabled={componentDisabled}>
        <Form.Item label="编辑信息" name="disabled" valuePropName="checked">
        <Checkbox >禁止</Checkbox></Form.Item>
        <Form.Item label="项目名称" name="name"
        rules={[ { required: true,message: '项目名称',}, ]}
      ><Input /></Form.Item>
        <Form.Item label="代码目录" name="code_path"><Input /></Form.Item>
        <Form.Item label="supervisor主机" name="supervisor_host"><Input /></Form.Item>
        <Form.Item label="supervisor配置目录" name="supervisor_confdir"><Input /></Form.Item>
        <Form.Item label="git地址" name="git_url"><Input /></Form.Item>
        <Form.Item label="数据库地址" name="db_addr"><Input /></Form.Item>
        <Form.Item label="数据库名" name="db_name"><Input /></Form.Item>
      <Form.Item ><Button htmlType="button" onClick= {handleSubmit} >提交</Button></Form.Item>
      </Form>
  )
})
