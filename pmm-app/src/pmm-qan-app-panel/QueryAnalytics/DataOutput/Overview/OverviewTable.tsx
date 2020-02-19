import { Table } from 'antd';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import './OverviewTable.scss';
import { StateContext } from '../../StateContext';
import { getDefaultColumns, getOverviewColumn, TABLE_X_SCROLL, TABLE_Y_SCROLL } from './Columns';
import OverviewTableService from './OverviewTable.service';

interface RowInterface {
  dimension?: string;
}
interface DataInterface {
  rows: RowInterface[];
  columns: any;
}
const OverviewTable = props => {
  const {
    dispatch,
    state: { labels, columns, pageNumber, pageSize, orderBy, from, to, groupBy, firstSeen, queryId, querySelected },
  } = useContext(StateContext);
  const [data, setData] = useState<DataInterface>({ rows: [], columns: [] });
  const [loading, setLoading] = useState(false);

  const setGroupBy = useCallback(value => {
    dispatch({
      type: 'CHANGE_GROUP_BY',
      payload: {
        groupBy: value,
      },
    });
  }, []);

  const onTableChange = useCallback((pagination, filters, sorter) => {
    let orderBy = '';
    if (sorter.order === 'ascend') {
      orderBy = sorter.columnKey;
    } else if (sorter.order === 'descend') {
      orderBy = `-${sorter.columnKey}`;
    }
    dispatch({
      type: 'CHANGE_SORT',
      payload: {
        orderBy: orderBy,
      },
    });
  }, []);

  const onRowClick = useCallback(
    (record, rowIndex) => {
      return {
        onClick: () => {
          console.log(rowIndex, record);
          dispatch({
            type: 'SELECT_QUERY',
            payload: {
              queryId: data.rows[rowIndex].dimension,
            },
          });
        },
      };
    },
    [data.rows]
  );

  useEffect(() => {
    const updateInstances = async () => {
      try {
        setLoading(true);
        // @ts-ignore
        const result = await OverviewTableService.getReport({
          labels,
          columns,
          pageNumber,
          pageSize,
          orderBy,
          from,
          to,
          groupBy,
          firstSeen,
        });

        props.setTotal(result.total_rows);
        const calculatedColumns = getDefaultColumns(groupBy, setGroupBy, pageNumber, pageSize, columns.length).concat(
          columns.map((key, index) => getOverviewColumn(key, index, result.rows[0], orderBy))
        );
        // @ts-ignore
        setData({ rows: result.rows, columns: calculatedColumns });
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    updateInstances().then(() => {});
  }, [columns, pageNumber, pageSize, groupBy, labels, firstSeen]);
  // @ts-ignore

  return (
    <Table
      dataSource={data.rows}
      onChange={onTableChange}
      columns={data.columns}
      size={'small'}
      bordered={true}
      pagination={false}
      scroll={{ y: TABLE_Y_SCROLL, x: TABLE_X_SCROLL }}
      onRow={onRowClick}
      rowClassName={record => {
        if (querySelected) {
          return String(record.dimension) === queryId ? 'selected-overview-row' : '';
        }
        return '';
      }}
      loading={loading}
    />
  );
};

export default OverviewTable;
