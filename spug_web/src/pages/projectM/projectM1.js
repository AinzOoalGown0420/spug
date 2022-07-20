import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Input, Card, Tree, Dropdown, Menu, Button, Tooltip, Spin, Modal } from 'antd';
import {
  FolderOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { AuthFragment } from 'components';
import { hasPermission, http } from 'libs';
import styles from './index.module.less';
import store from './store';
import lds from 'lodash';

export default observer(function () {
  const [loading, setLoading] = useState();
  const [visible, setVisible] = useState(false);
  const [draggable, setDraggable] = useState(false);
  const [action, setAction] = useState('');
  const [expands, setExpands] = useState();
  const [bakTreeData, setBakTreeData] = useState();

  useEffect(() => {
    if (loading === false) store.fetchprojects()
  }, [loading])

  const menus = (
    <Menu onClick={() => setVisible(false)}>
      <Menu.Item key="0" icon={<FolderOutlined/>} onClick={handleAddRoot}>新建根项目</Menu.Item>
      <Menu.Item key="1" icon={<FolderAddOutlined/>} onClick={handleAdd}>新建子项目</Menu.Item>
      <Menu.Item key="2" icon={<EditOutlined/>} onClick={() => setAction('edit')}>重命名</Menu.Item>
      <Menu.Divider/>
      <Menu.Item key="3" icon={<CopyOutlined/>} onClick={() => store.showSelector(true)}>添加至项目</Menu.Item>
      <Menu.Item key="4" icon={<ScissorOutlined/>} onClick={() => store.showSelector(false)}>移动至项目</Menu.Item>
      <Menu.Divider/>
      <Menu.Item key="6" icon={<DeleteOutlined/>} danger onClick={handleRemove}>删除此项目</Menu.Item>
    </Menu>
  )

  function handleSubmit() {
    if (store.group.title) {
      setLoading(true);
      const {key, parent_id, title} = store.group;
      http.post('/api/projectM/', {id: key || undefined, parent_id, name: title})
        .then(() => setAction(''))
        .finally(() => setLoading(false))
    } else {
      if (store.group.key === 0) store.treeData = bakTreeData
      setAction('')
    }
  }

  function handleRemove() {
    setAction('del');
    setLoading(true);
    http.delete('/api/projectM/', {params: {id: store.group.key}})
      .finally(() => {
        setAction('');
        setLoading(false)
      })
  }

  function handleAddRoot() {
    setBakTreeData(lds.cloneDeep(store.treeData));
    const current = {key: 0, parent_id: 0, title: ''};
    store.treeData.unshift(current);
    store.treeData = lds.cloneDeep(store.treeData);
    store.group = current;
    setAction('edit')
  }

  function handleAdd() {
    setBakTreeData(lds.cloneDeep(store.treeData));
    const current = {key: 0, parent_id: store.group.key, title: ''};
    store.group.children.unshift(current);
    store.treeData = lds.cloneDeep(store.treeData);
    if (!expands.includes(store.group.key)) setExpands([store.group.key, ...expands]);
    store.group = current;
    setAction('edit');
  }

  function handleDrag(v) {
    setLoading(true);
    const pos = v.node.pos.split('-');
    const dropPosition = v.dropPosition - Number(pos[pos.length - 1]);
    http.patch('/api/projectM/', {s_id: v.dragNode.key, d_id: v.node.key, action: dropPosition})
      .then(() => setLoading(false))
  }

  function handleRightClick(v) {
    if (hasPermission('admin')) {
      store.group = v.node;
      setVisible(true)
    }
  }

  function handleExpand(keys, {_, node}) {
    if (node.children.length > 0) {
      setExpands(keys)
    }
  }
  function handleSelect(keys, {_, node}) {
    store.fetchqueue(node.key)
    store.fetchlog(node.key)
    store.getfilelist(node.key)
    store.group = node
    store.projid = node.key
  }

  function treeRender(nodeData) {
    if (action === 'edit' && nodeData.key === store.group.key) {
      return <Input
        autoFocus
        size="small"
        style={{width: 'calc(100% - 24px)'}}
        defaultValue={nodeData.title}
        suffix={loading ? <LoadingOutlined/> : <span/>}
        onClick={e => e.stopPropagation()}
        onBlur={handleSubmit}
        onChange={e => store.group.title = e.target.value}
        onPressEnter={handleSubmit}/>
    } else if (action === 'del' && nodeData.key === store.group.key) {
      return <LoadingOutlined style={{marginLeft: '4px'}}/>
    } else {
      return (
        <span style={{lineHeight: '24px'}}>{nodeData.title}</span>
      )
    }
  }

  const treeData = store.treeData;
  return (
    <Card
      title="项目列表"
      className={styles.group}
      extra={(
        <AuthFragment auth="project.projectM.view">
          <Button htmlType="primary" icon={<ReloadOutlined />} onClick= {store.initial} >刷新</Button>
          <Tooltip title="修改后记录没更新，点击刷新。">
            <QuestionCircleOutlined style={{marginLeft: 8, color: '#999'}}/>
          </Tooltip>
        </AuthFragment>)}>
      <Spin spinning={store.grpFetching}>
        <Dropdown
          overlay={menus}
          visible={visible}
          trigger={['contextMenu']}
          onVisibleChange={v => v || setVisible(v)}>
          <Tree.DirectoryTree
            className={styles.scro}
            autoExpandParent={false}
            expandAction="doubleClick"
            draggable={draggable}
            treeData={treeData}
            titleRender={treeRender}
            expandedKeys={expands}
            selectedKeys={[store.group.key]}
            onSelect={handleSelect}
            onExpand={handleExpand}
            onDrop={handleDrag}
            onRightClick={handleRightClick}
          />
        </Dropdown>
      </Spin>
      {treeData.length === 1 && treeData[0].children.length === 0 && (
        <div style={{color: '#999', marginTop: 20, textAlign: 'center'}}>右键点击项目进行分组管理哦~</div>
      )}
      {treeData.length === 0 && (
        <div style={{color: '#999'}}>你还没有可访问的项目分组，请联系管理员分配项目权限。</div>
      )}
    </Card>
  )
})
