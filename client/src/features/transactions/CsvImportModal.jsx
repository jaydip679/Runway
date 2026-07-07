import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button/Button';
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label">Target Account</label>
            <select 
              className="input-field" 
              value={accountId} 
              onChange={e => setAccountId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)' }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">CSV File</label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={e => setFile(e.target.files[0])}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={handleClose} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleUpload} isLoading={isUploading} disabled={!file || !accountId}>Upload & Import</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Import Status: {jobStatus?.status || 'PENDING'}</h3>
          {jobStatus?.totalRows !== undefined && (
            <div>
              <p>Total Rows: {jobStatus.totalRows}</p>
              <p style={{ color: 'var(--success)' }}>Success: {jobStatus.successRows}</p>
              <p style={{ color: 'var(--error)' }}>Failed: {jobStatus.failedRows}</p>
            </div>
          )}
          
          {jobStatus?.status === 'FAILED' && (
            <div style={{ color: 'var(--error)', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
              Import failed. {jobStatus.errorLog?.[0]?.reason}
            </div>
          )}
          
          {jobStatus?.status === 'COMPLETED' && jobStatus?.errorLog && (
            <div style={{ marginTop: '12px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', padding: '8px', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--error)' }}>Row Errors</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
                {jobStatus.errorLog.map((err, i) => (
                  <li key={i}>Row {err.rowNumber}: {err.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
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
