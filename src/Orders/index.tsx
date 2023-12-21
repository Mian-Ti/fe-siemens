import "./index.css";
import React, { useState, useEffect, useCallback, useMemo, Key } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  InputNumber,
  message,
  TableProps,
} from "antd";
import axios from "axios";
import { Order } from "./index.d";
import { API_URL } from "../constants";
import { FilterValue, SorterResult } from "antd/es/table/interface";

const Orders: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [orders, setOrders] = useState([] as Order[]);
  const [filteredOrders, setFilteredOrders] = useState([] as Order[]);
  const [modifyModalVisible, setModifyModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState({} as Partial<Order>);
  const [form] = Form.useForm();

  const [filteredInfo, setFilteredInfo] = useState<
    Record<string, FilterValue | null>
  >({});
  const [sortedInfo, setSortedInfo] = useState<SorterResult<Order>>({});

  const fetchOrders = useCallback(() => {
    axios
      .get(`${API_URL}/orders`)
      .then((response) => {
        setOrders(response.data);
        setFilteredOrders(response.data);
      })
      .catch((error) => {
        console.error("Error fetching orders:", error);
      });
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCreateOrder = useCallback(() => {
    setCurrentOrder({ orderId: -1 });
    setModifyModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModifyModalVisible(false);
    form.resetFields();
  }, [form]);

  const handleSaveOrder = useCallback(() => {
    form.validateFields().then((values) => {
      axios
        .post(`${API_URL}/orders`, values)
        .then(() => {
          fetchOrders();
          handleCloseModal();
          messageApi.success("订单创建成功");
        })
        .catch((error) => {
          console.error("Error creating order:", error);
        });
    });
  }, [fetchOrders, form, handleCloseModal, messageApi]);

  const handleEditOrder = useCallback(
    (order: Order) => {
      setCurrentOrder(order);
      form.setFieldsValue(order);
      setModifyModalVisible(true);
    },
    [form]
  );

  const handleUpdateOrder = useCallback(() => {
    form.validateFields().then((values) => {
      axios
        .put(`${API_URL}/orders/${currentOrder.orderId}`, values)
        .then(() => {
          fetchOrders();
          handleCloseModal();
          messageApi.success("订单更新成功");
        })
        .catch((error) => {
          console.error("Error updating order:", error);
        });
    });
  }, [currentOrder.orderId, fetchOrders, form, handleCloseModal, messageApi]);

  const handleDeleteOrder = useCallback(
    (orderId: number) => {
      axios
        .delete(`${API_URL}/orders/${orderId}`)
        .then(() => {
          fetchOrders();
          messageApi.success("订单删除成功");
        })
        .catch((error) => {
          console.error("Error deleting order:", error);
        });
    },
    [fetchOrders, messageApi]
  );

  const handleSearch = useCallback(
    (value: string) => {
      const filtered = orders.filter((order) => {
        const orderId = order.orderId + "";
        const orderName = order.orderName.toLowerCase();
        const orderDescription = order.orderDescription.toLowerCase();
        const keyword = value.toLowerCase();
        return (
          orderName.includes(keyword) ||
          orderDescription.includes(keyword) ||
          orderId.includes(keyword)
        );
      });
      setFilteredOrders(filtered);
    },
    [orders]
  );

  const clearSortInfo = useCallback(() => {
    setFilteredOrders(orders);
    setSortedInfo({});
  }, [orders]);

  const handleTableChange: TableProps<Order>["onChange"] = (
    pagination,
    filters,
    sorter
  ) => {
    console.log("Various parameters", pagination, filters, sorter);
    setFilteredInfo(filters);
    setSortedInfo(sorter as SorterResult<Order>);
  };

  const orderNames = useMemo(() => {
    return orders.map((c) => {
      return { text: c.orderName, value: c.orderName };
    });
  }, [orders]);

  const orderDescriptions = useMemo(() => {
    return orders.map((c) => {
      return { text: c.orderDescription, value: c.orderDescription };
    });
  }, [orders]);

  const columns = useMemo(() => {
    return [
      {
        title: "订单名称",
        dataIndex: "orderName",
        key: "orderName",
        filters: orderNames,
        filteredValue: filteredInfo.orderName || null,
        onFilter: (value: boolean | Key, record: Order) =>
          record.orderName.includes(value.toString()),
        sorter: (a: Order, b: Order) => a.orderName.length - b.orderName.length,
        sortOrder:
          sortedInfo.columnKey === "orderName" ? sortedInfo.order : null,
        ellipsis: true,
      },
      {
        title: "订单描述",
        dataIndex: "orderDescription",
        key: "orderDescription",
        filters: orderDescriptions,
        filteredValue: filteredInfo.orderDescription || null,
        onFilter: (value: boolean | Key, record: Order) =>
          record.orderDescription.includes(value.toString()),
        sorter: (a: Order, b: Order) =>
          a.orderDescription.length - b.orderDescription.length,
        sortOrder:
          sortedInfo.columnKey === "orderDescription" ? sortedInfo.order : null,
        ellipsis: true,
      },
      {
        title: "金额",
        dataIndex: "amount",
        key: "amount",
        sorter: (a: Order, b: Order) =>
          parseFloat(a.amount) - parseFloat(b.amount),
        sortOrder: sortedInfo.columnKey === "amount" ? sortedInfo.order : null,
        ellipsis: true,
      },
      {
        title: "操作",
        dataIndex: "operation",
        key: "operation",
        render: (_: any, record: Order) => (
          <div>
            <Button type="link" onClick={() => handleEditOrder(record)}>
              编辑
            </Button>
            <Popconfirm
              title="删除订单"
              description="确定要删除该订单吗？"
              onConfirm={() => handleDeleteOrder(record.orderId)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </div>
        ),
      },
    ];
  }, [
    filteredInfo.orderDescription,
    filteredInfo.orderName,
    handleDeleteOrder,
    handleEditOrder,
    orderDescriptions,
    orderNames,
    sortedInfo.columnKey,
    sortedInfo.order,
  ]);

  return (
    <div>
      <h1>订单列表</h1>
      {contextHolder}
      <div className="ListContainer">
        <Input.Search
          placeholder="搜索订单"
          onSearch={handleSearch}
          className="SearchInput"
        />
        <Button
          type="primary"
          className="CreateButton"
          onClick={handleCreateOrder}
        >
          创建订单
        </Button>
        <Button
          type="primary"
          disabled={!sortedInfo.columnKey}
          onClick={clearSortInfo}
        >
          清除筛选
        </Button>
      </div>
      <Table
        onChange={handleTableChange}
        dataSource={filteredOrders}
        columns={columns}
        pagination={{ position: ["bottomRight"] }}
      />
      <Modal
        title={currentOrder.orderId !== -1 ? "编辑订单" : "创建订单"}
        open={modifyModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={
              currentOrder.orderId !== -1 ? handleUpdateOrder : handleSaveOrder
            }
          >
            {currentOrder.orderId !== -1 ? "保存" : "创建"}
          </Button>,
        ]}
      >
        <Form form={form}>
          <Form.Item
            name="orderName"
            label="订单名称"
            rules={[{ required: true }]}
          >
            <Input type="" />
          </Form.Item>
          <Form.Item
            name="orderDescription"
            label="订单描述"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, type: "number", min: 0 }]}
          >
            <InputNumber prefix="￥" className="NumberInput" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
