import { put, call, takeEvery, select } from 'redux-saga/effects';

import {
  UPDATE_LAST_EXECUTION,
  CLUSTER_EXECUTION_REQUESTED,
  HOST_EXECUTION_REQUESTED,
} from '@state/actions/lastExecutions';
import { notify } from '@state/actions/notifications';
import {
  getLastExecutionByGroupID,
  triggerClusterChecksExecution,
  triggerHostChecksExecution,
} from '@lib/api/checks';
import {
  setLastExecutionLoading,
  setLastExecution,
  setLastExecutionEmpty,
  setLastExecutionError,
  setExecutionRequested,
  setHostChecksExecutionRequested,
} from '@state/lastExecutions';

import { getClusterName } from '@state/selectors/cluster';

export function* updateLastExecution({ payload }) {
  const { groupID } = payload;

  yield put(setLastExecutionLoading(groupID));

  try {
    const { data } = yield call(getLastExecutionByGroupID, groupID);

    yield put(setLastExecution(data));
  } catch (error) {
    if (error.response && error.response.status === 404) {
      yield put(setLastExecutionEmpty(groupID));

      return;
    }

    yield put(setLastExecutionError({ groupID, error: error.message }));
  }
}

export function* requestExecution({ payload }) {
  const { clusterID, navigate } = payload;
  const clusterName = yield select(getClusterName(clusterID));

  try {
    yield call(triggerClusterChecksExecution, clusterID);
    yield put(setExecutionRequested(payload));
    yield put(
      notify({
        text: `Checks execution requested, cluster: ${clusterName}`,
        icon: '🐰',
      })
    );
    navigate(`/clusters/${clusterID}/executions/last`);
  } catch (error) {
    yield put(
      notify({
        text: `Unable to start execution for cluster: ${clusterName}`,
        icon: '❌',
      })
    );
  }
}

export function* requestHostExecution({ payload }) {
  const { host, navigate } = payload;
  const { id: hostID, hostname: hostName } = host;

  try {
    yield call(triggerHostChecksExecution, hostID);
    yield put(setHostChecksExecutionRequested(payload));
    yield put(
      notify({
        text: `Checks execution requested, host: ${hostName}`,
        icon: '🐰',
      })
    );
    navigate(`/hosts/${hostID}/executions/last`);
  } catch (error) {
    yield put(
      notify({
        text: `Unable to start execution for host: ${hostName}`,
        icon: '❌',
      })
    );
  }
}

export function* watchUpdateLastExecution() {
  yield takeEvery(UPDATE_LAST_EXECUTION, updateLastExecution);
}

export function* watchRequestExecution() {
  yield takeEvery(CLUSTER_EXECUTION_REQUESTED, requestExecution);
}

export function* watchHostRequestExecution() {
  yield takeEvery(HOST_EXECUTION_REQUESTED, requestHostExecution);
}
