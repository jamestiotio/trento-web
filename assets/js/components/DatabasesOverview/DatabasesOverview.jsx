/* eslint-disable react/no-unstable-nested-components */
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { filter } from 'lodash';

import PageHeader from '@components/PageHeader';
import HealthIcon from '@components/Health';
import Table from '@components/Table';
import Tags from '@components/Tags';
import HealthSummary from '@components/HealthSummary/HealthSummary';
import DeregistrationModal from '@components/DeregistrationModal';
import { getCounters } from '@components/HealthSummary/summarySelection';

import { DATABASE_TYPE } from '@lib/model';

import DatabaseItemOverview from './DatabaseItemOverview';

function DatabasesOverview({
  databases,
  databaseInstances,
  loading,
  onTagAdd,
  onTagRemove,
  onInstanceCleanUp,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cleanUpModalOpen, setCleanUpModalOpen] = useState(false);
  const [instanceToDeregister, setInstanceToDeregister] = useState(undefined);

  const config = {
    pagination: true,
    usePadding: false,
    collapsedRowClassName: 'bg-gray-100',
    columns: [
      {
        title: 'Health',
        key: 'health',
        filter: true,
        filterFromParams: true,
        render: (content) => (
          <div className="ml-4">
            <HealthIcon health={content} />
          </div>
        ),
      },
      {
        title: 'SID',
        key: 'sid',
        filterFromParams: true,
        filter: true,
        render: (content, item) => (
          <Link
            className="text-jungle-green-500 hover:opacity-75"
            to={`/databases/${item.id}`}
          >
            {content}
          </Link>
        ),
      },
      {
        title: 'Summary',
        key: 'instanceCount',
        render: (content, item) => {
          const statusAggregation = item.databaseInstances?.reduce(
            (acc, curr) => {
              switch (curr.health) {
                case 'passing':
                  acc.passing += 1;
                  break;
                case 'warning':
                  acc.warning += 1;
                  break;
                case 'critical':
                  acc.critical += 1;
                  break;
                default:
              }
              return acc;
            },
            {
              passing: 0,
              warning: 0,
              critical: 0,
            }
          );
          return (
            <div>
              {item.databaseInstances?.length} instances:{' '}
              {statusAggregation.critical} critical,
              {statusAggregation.warning} warning, {statusAggregation.passing}{' '}
              passing
              {content}
            </div>
          );
        },
      },
      {
        title: 'Tags',
        key: 'tags',
        className: 'w-80',
        filterFromParams: true,
        filter: (filters, key) => (element) =>
          element[key].some((tag) => filters.includes(tag)),
        render: (content, item) => (
          <Tags
            tags={content}
            resourceId={item.id}
            onChange={() => {}}
            onAdd={(tag) => onTagAdd(tag, item.id)}
            onRemove={(tag) => onTagRemove(tag, item.id)}
          />
        ),
      },
    ],
    collapsibleDetailRenderer: (database) => (
      <DatabaseItemOverview
        database={database}
        onCleanUpClick={(instance, _type) => {
          setCleanUpModalOpen(true);
          setInstanceToDeregister(instance);
        }}
      />
    ),
  };

  const data = databases.map((database) => ({
    id: database.id,
    health: database.health,
    sid: database.sid,
    attachedRdbms: database.tenant,
    tenant: database.tenant,
    dbAddress: database.db_host,
    databaseInstances: filter(databaseInstances, {
      sap_system_id: database.id,
    }),
    tags: (database.tags && database.tags.map((tag) => tag.value)) || [],
  }));

  const counters = getCounters(data || []);

  return loading ? (
    'Loading HANA Databases...'
  ) : (
    <>
      <PageHeader className="font-bold">HANA Databases</PageHeader>
      <DeregistrationModal
        contentType={DATABASE_TYPE}
        instanceNumber={instanceToDeregister?.instance_number}
        sid={instanceToDeregister?.sid}
        isOpen={!!cleanUpModalOpen}
        onCleanUp={() => {
          setCleanUpModalOpen(false);
          onInstanceCleanUp(instanceToDeregister);
        }}
        onCancel={() => {
          setCleanUpModalOpen(false);
        }}
      />
      <div className="bg-white rounded-lg shadow">
        <HealthSummary {...counters} className="px-4 py-2" />
        <Table
          config={config}
          data={data}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          rowKey={(item, _index) => item.id}
        />
      </div>
    </>
  );
}

export default DatabasesOverview;
