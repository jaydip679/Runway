import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { importCsv, getImportStatus } from '../../api/transactionsApi';
import { getAccounts } from '../../api/accountsApi';

const CsvImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getAccounts({ limit: 100 }).then(res => {
        const accs = res.data || res;
        setAccounts(accs);
        if (accs.length > 0) setAccountId(accs[0].id);
      }).catch(console.error);
      
      // Reset state
      setFile(null);
      setJobId(null);
      setJobStatus(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (jobId && jobStatus?.status !== 'COMPLETED' && jobStatus?.status !== 'FAILED') {
      interval = setInterval(async () => {
        try {
          const res = await getImportStatus(jobId);
          const statusData = res.data || res;
          setJobStatus(statusData);
          if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
            clearInterval(interval);
            if (statusData.status === 'COMPLETED') {
              onImportComplete();
            }
          }
        } catch (err) {
          console.error('Failed to poll status', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, jobStatus, onImportComplete]);

  const handleUpload = async () => {
    if (!file || !accountId) return;
    try {
      setIsUploading(true);
      const res = await importCsv(accountId, file);
      setJobId(res.data?.jobId || res.jobId);
      setJobStatus({ status: 'PENDING' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (jobStatus?.status === 'PROCESSING') {
      alert('Import is still processing in the background.');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Transactions (CSV)">
      {!jobId ? (
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Account</label>
            <select 
              value={accountId} 
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CSV File</label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={e => setFile(e.target.files[0])}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/30 dark:file:text-brand-400"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" onClick={handleClose} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleUpload} isLoading={isUploading} disabled={!file || !accountId}>Upload & Import</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Status: <span className="text-brand-500">{jobStatus?.status || 'PENDING'}</span></h3>
          {jobStatus?.totalRows !== undefined && (
            <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Total Rows: {jobStatus.totalRows}</p>
              <p className="text-finance-600 dark:text-finance-400 font-medium">Success: {jobStatus.successRows}</p>
              <p className="text-red-600 dark:text-red-400 font-medium">Failed: {jobStatus.failedRows}</p>
            </div>
          )}
          
          {jobStatus?.status === 'FAILED' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg text-sm text-red-600 dark:text-red-400">
              Import failed. {jobStatus.errorLog?.[0]?.reason}
            </div>
          )}
          
          {jobStatus?.status === 'COMPLETED' && jobStatus?.errorLog && jobStatus.errorLog.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Row Errors</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {jobStatus.errorLog.map((err, i) => (
                  <li key={i}>Row {err.rowNumber}: {err.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button onClick={handleClose} disabled={jobStatus?.status === 'PROCESSING'}>
              {jobStatus?.status === 'COMPLETED' ? 'Done' : 'Close'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CsvImportModal;
