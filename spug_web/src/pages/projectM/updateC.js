import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Form, Input, Button, Radio } from 'antd';
import store from './store';
import { http, X_TOKEN } from 'libs';
import { update } from 'lodash';


export default observer(function () {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { TextArea } = Input;

    function handleSubmit() {
        setLoading(true);
        const respon = '';
        const formData = form.getFieldsValue();
        formData['project_id'] = store.group.key;
        console.log(formData)
         return http.post('/api/projectM/updateC/', formData)
           .then(res => {
             if (res){
               store.update_info = res;
               store.logVisible = true;
             }
           })
           .finally(() => setLoading(false))}

    return (
        <Form form={form} labelCol={{span: 5}} wrapperCol={{span: 17}}>
          <Form.Item label="当文件冲突时" name="option">
            <Radio.Group >
              <Radio value='stop'>不更新</Radio>
              <Radio value='new_file'>使用新文件</Radio>
              <Radio value='old_file'>使用旧文件</Radio>
            </Radio.Group>
          </Form.Item>
        <Form.Item label="更新内容" name="content"><TextArea rows={4} /></Form.Item>
        <Form.Item label="数据库操作" name="db_opt"><TextArea  rows={6}/></Form.Item>
        <Form.Item label="定时任务" name="cron"><Input /></Form.Item>
      <Form.Item ><Button type="primary" ghost onClick= {handleSubmit} >更新</Button></Form.Item>
      </Form>
    )
})