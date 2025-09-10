import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Table,
  Button,
  message,
  Typography,
  Space,
  Tag,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Drawer,
  Divider,
  Empty,
  Segmented,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  CloudDownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileMarkdownOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

import api from '../../services/api';
import {
  finalizeProposal,
  downloadFinalArtifact,
  getFinalArtifactText,
  getConsolidatedMarkdownText,
  exportConsolidated,
} from '../../services/finalService';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

type Status = 'pending' | 'processed' | 'negotiating' | 'finalized';

interface ProposalRow {
  _id: string;
  title: string;
  status: Status;
  negotiationId?: string | null;
  submitter?: { _id: string; name?: string; email?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------- UI helpers ------------------------------- */
const StatusTag: React.FC<{ status: Status }> = ({ status }) => {
  const map: Record<Status, { color: string; text: string }> = {
    pending: { color: 'gold', text: 'PENDING' },
    processed: { color: 'blue', text: 'PROCESSED' },
    negotiating: { color: 'geekblue', text: 'NEGOTIATING' },
    finalized: { color: 'green', text: 'FINALIZED' },
  };
  const { color, text } = map[status] ?? { color: 'default', text: status.toUpperCase() };
  return <Tag color={color}>{text}</Tag>;
};

// Try primary admin list, fall back to public/all endpoint if needed
async function fetchAdminProposals(params: Record<string, any>) {
  try {
    const { data } = await api.get<{ proposals: ProposalRow[]; total: number }>('/admin/proposals', {
      params,
    });
    return data;
  } catch {
    const { data } = await api.get<ProposalRow[]>('/proposals/all', { params });
    return { proposals: data, total: data.length ?? 0 };
  }
}

const FinalizePage: React.FC = () => {
  /* ----------------------- table + query state ----------------------- */
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [query, setQuery] = useState<string>('');
  const [status, setStatus] = useState<Status | 'all'>('pending');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [loading, setLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  /* ---------------- preview drawer (single artifact) ---------------- */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewText, setPreviewText] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  /* ------------------------ consolidated opts ----------------------- */
  const [conTopicKey, setConTopicKey] = useState<string>('');
  const [conRange, setConRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [conFormat, setConFormat] = useState<'srs' | 'plain'>('srs');
  const [conOutput, setConOutput] = useState<'md' | 'docx' | 'pdf'>('md');
  const [conPolish, setConPolish] = useState<'none' | 'md' | 'gemini'>('none');

  const [conPreviewOpen, setConPreviewOpen] = useState(false);
  const [conPreviewText, setConPreviewText] = useState('');
  const [conLoading, setConLoading] = useState(false);

  /* --------------------------- query params ------------------------- */
  const apiParams = useMemo(() => {
    const params: Record<string, any> = {
      q: query || undefined,
      status: status === 'all' ? undefined : status,
      page,
      limit: pageSize,
    };
    if (dateRange?.[0]) params.since = dateRange[0]!.toISOString();
    if (dateRange?.[1]) params.until = dateRange[1]!.toISOString();
    return params;
  }, [query, status, page, pageSize, dateRange]);

  /* ----------------------------- load data -------------------------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProposals(apiParams);
      setRows(
        (data.proposals || []).map((p) => ({
          _id: p._id,
          title: p.title,
          status: (p.status as Status) || 'pending',
          negotiationId: p.negotiationId ?? null,
          submitter: p.submitter || null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      );
      setTotal(data.total ?? 0);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to load proposals.');
    } finally {
      setLoading(false);
    }
  }, [apiParams]);

  useEffect(() => {
    load();
  }, [load]);

  /* -------------------------------- actions ------------------------- */
  const doFinalize = async (proposalId: string) => {
    try {
      setRowLoadingId(proposalId);
      const res = await finalizeProposal(proposalId, { idempotencyKey: crypto.randomUUID() });
      if (res.success) {
        message.success('Finalized successfully.');
        setRows((prev) =>
          prev.map((r) =>
            r._id === proposalId
              ? {
                  ...r,
                  status: 'finalized',
                  negotiationId:
                    res.finalProposal?.negotiationId || r.negotiationId || res.finalProposal?._id,
                }
              : r,
          ),
        );
      } else {
        message.warning(res.message || 'Finalize returned no success flag.');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to finalize.');
    } finally {
      setRowLoadingId(null);
    }
  };

  const doBatchFinalize = async () => {
    if (!selectedRowKeys.length) return;
    const ids = selectedRowKeys as string[];
    const idempotencyBase = crypto.randomUUID();

    const loadingKey = 'batchFinalize';
    message.loading({ key: loadingKey, content: 'Finalizing selected proposals…' });

    const results = await Promise.allSettled(
      ids.map((id, i) => finalizeProposal(id, { idempotencyKey: `${idempotencyBase}:${i}` })),
    );

    const ok = results.filter((r) => r.status === 'fulfilled' && (r as any).value?.success).length;
    const fail = results.length - ok;

    await load();
    setSelectedRowKeys([]);

    if (fail === 0) {
      message.success({ key: loadingKey, content: `Finalized ${ok} proposals.` });
    } else {
      message.warning({ key: loadingKey, content: `Finalized ${ok}; ${fail} failed.` });
    }
  };

  const previewArtifact = async (record: ProposalRow) => {
    if (!record.negotiationId) {
      message.info('No artifact yet. Finalize first to generate a final text.');
      return;
    }
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewTitle(`${record.title} — Final Artifact`);
    try {
      const txt = await getFinalArtifactText(record.negotiationId);
      setPreviewText(txt || '(empty)');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to fetch artifact.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadArtifact = async (record: ProposalRow) => {
    if (!record.negotiationId) {
      message.info('No artifact yet. Finalize first.');
      return;
    }
    try {
      await downloadFinalArtifact(record.negotiationId);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to download artifact.');
    }
  };

  /* --------------------------- consolidated ------------------------- */
  const currentFilters = useMemo(
    () => ({
      topicKey: conTopicKey || undefined,
      since: conRange?.[0]?.toISOString(),
      until: conRange?.[1]?.toISOString(),
    }),
    [conTopicKey, conRange],
  );

  const doDownloadConsolidated = async () => {
    setConLoading(true);
    try {
      const res = await exportConsolidated({
        filters: currentFilters,
        format: conFormat,
        output: conOutput,
        polish: conPolish === 'none' ? undefined : conPolish,
        download: true,
      });
      if (res?.filename) message.success(`Exported ${res.filename}`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to export consolidated SRS.');
    } finally {
      setConLoading(false);
    }
  };

  const doPreviewConsolidated = async () => {
    setConPreviewOpen(true);
    setConLoading(true);
    try {
      if (conFormat === 'plain') {
        const txt = await getConsolidatedMarkdownText(currentFilters, { polish: undefined });
        setConPreviewText(txt);
        message.info('Preview shows SRS markdown. Use export to get plain/DOCX/PDF.');
      } else {
        const txt = await getConsolidatedMarkdownText(currentFilters, {
          polish: conPolish === 'none' ? undefined : conPolish,
        });
        setConPreviewText(txt);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to preview consolidated SRS.');
    } finally {
      setConLoading(false);
    }
  };

  /* --------------------------- table columns ------------------------ */
  const columns = [
    {
      title: 'Proposal ID',
      dataIndex: '_id',
      key: '_id',
      width: 260,
      ellipsis: true,
      render: (id: string) => <Text code copyable>{id}</Text>,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: Status) => <StatusTag status={s} />,
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Processed', value: 'processed' },
        { text: 'Negotiating', value: 'negotiating' },
        { text: 'Finalized', value: 'finalized' },
      ],
      onFilter: (value: any, r: ProposalRow) => r.status === value,
    },
    {
      title: 'Negotiation',
      dataIndex: 'negotiationId',
      key: 'negotiationId',
      width: 260,
      ellipsis: true,
      render: (nid?: string) => (nid ? <Text code copyable>{nid}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Submitter',
      dataIndex: 'submitter',
      key: 'submitter',
      width: 260,
      ellipsis: true,
      render: (u: ProposalRow['submitter']) =>
        u ? (
          <span>
            <Text>{u.name || 'User'}</Text>
            {u.email ? <Text type="secondary"> — {u.email}</Text> : null}
          </span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (d?: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '—'),
      sorter: (a: ProposalRow, b: ProposalRow) =>
        dayjs(a.updatedAt || 0).valueOf() - dayjs(b.updatedAt || 0).valueOf(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 320,
      render: (_: any, record: ProposalRow) => {
        const canDownload = !!record.negotiationId;
        return (
          <Space>
            <Popconfirm
              title="Finalize this proposal?"
              okText="Finalize"
              okButtonProps={{ type: 'primary' }}
              onConfirm={() => doFinalize(record._id)}
              disabled={record.status === 'finalized'}
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={rowLoadingId === record._id}
                disabled={record.status === 'finalized'}
              >
                Finalize
              </Button>
            </Popconfirm>

            <Tooltip title={canDownload ? 'Preview final text' : 'No final text yet'}>
              <Button icon={<EyeOutlined />} onClick={() => previewArtifact(record)} disabled={!canDownload}>
                Preview
              </Button>
            </Tooltip>

            <Tooltip title={canDownload ? 'Download .txt' : 'No final text yet'}>
              <Button icon={<FileTextOutlined />} onClick={() => downloadArtifact(record)} disabled={!canDownload}>
                Download
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col>
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0 }}>
              Finalize Proposals
            </Title>
            <Text type="secondary">
              Run single or batch finalization, preview artifacts, and export consolidated, IEEE-style SRS deliverables.
            </Text>
          </Space>
        </Col>
        <Col>
          <Space wrap>
            <Tooltip title="Refresh list">
              <Button icon={<ReloadOutlined />} onClick={load} />
            </Tooltip>
            <Popconfirm
              title={`Finalize ${selectedRowKeys.length} selected proposals?`}
              okText="Finalize"
              onConfirm={doBatchFinalize}
              disabled={!selectedRowKeys.length}
            >
              <Badge count={selectedRowKeys.length || 0} size="small" offset={[6, -2]}>
                <Button type="primary" icon={<CheckCircleOutlined />} disabled={!selectedRowKeys.length}>
                  Finalize Selected
                </Button>
              </Badge>
            </Popconfirm>
          </Space>
        </Col>
      </Row>

      <Divider />

      {/* Filters */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={8}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search title, id, submitter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              load();
            }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Select<Status | 'all'>
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: '100%' }}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'processed', label: 'Processed' },
              { value: 'negotiating', label: 'Negotiating' },
              { value: 'finalized', label: 'Finalized' },
            ]}
          />
        </Col>
        <Col xs={24} md={10}>
          <RangePicker
            allowEmpty={[true, true]}
            value={dateRange as any}
            onChange={(r) => {
              setDateRange(r);
              setPage(1);
            }}
            style={{ width: '100%' }}
            showTime
            placeholder={['Since', 'Until']}
          />
        </Col>
      </Row>

      {/* Consolidated options */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={8}>
          <Input
            allowClear
            placeholder="Consolidated filter — topicKey (optional)"
            value={conTopicKey}
            onChange={(e) => setConTopicKey(e.target.value)}
          />
        </Col>
        <Col xs={24} md={10}>
          <RangePicker
            allowEmpty={[true, true]}
            value={conRange as any}
            onChange={(r) => setConRange(r)}
            style={{ width: '100%' }}
            showTime
            placeholder={['Consolidated since', 'Consolidated until']}
          />
        </Col>
      </Row>

      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text type="secondary">Format</Text>
            <Segmented
              block
              value={conFormat}
              onChange={(v) => setConFormat(v as 'srs' | 'plain')}
              options={[
                { label: 'IEEE SRS', value: 'srs' },
                { label: 'Plain List', value: 'plain' },
              ]}
            />
          </Space>
        </Col>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text type="secondary">Output</Text>
            <Segmented
              block
              value={conOutput}
              onChange={(v) => setConOutput(v as 'md' | 'docx' | 'pdf')}
              options={[
                { label: (<><FileMarkdownOutlined /> MD</>), value: 'md' },
                { label: (<><FileWordOutlined /> DOCX</>), value: 'docx' },
                { label: (<><FilePdfOutlined /> PDF</>), value: 'pdf' },
              ]}
            />
          </Space>
        </Col>
        <Col xs={24} md={8}>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text type="secondary">
              Polish <Tooltip title="Optional LLM polish for human-like tone. IDs & traceability are preserved."><ExperimentOutlined /></Tooltip>
            </Text>
            <Segmented
              block
              value={conPolish}
              onChange={(v) => setConPolish(v as 'none' | 'md' | 'gemini')}
              options={[
                { label: 'None', value: 'none' },
                { label: 'SRS text', value: 'md' },
                { label: 'Gemini Polish', value: 'gemini' },
              ]}
            />
          </Space>
        </Col>
      </Row>

      <Row justify="end" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Tooltip title="Preview SRS (Markdown)">
            <Button onClick={doPreviewConsolidated} loading={conLoading} icon={<EyeOutlined />}>
              Preview Consolidated
            </Button>
          </Tooltip>
          <Tooltip title="Export with the chosen options">
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={doDownloadConsolidated}
              loading={conLoading}
            >
              Export SRS
            </Button>
          </Tooltip>
        </Space>
      </Row>

      {/* Table */}
      <Table<ProposalRow>
        rowKey="_id"
        loading={loading}
        dataSource={rows}
        columns={columns as any}
        sticky
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        locale={{
          emptyText: (
            <Empty description="No proposals found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            disabled: record.status === 'finalized',
          }),
        }}
        scroll={{ x: 1200 }}
      />

      {/* Final artifact preview */}
      <Drawer
        title={previewTitle}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={720}
      >
        {previewLoading ? (
          <Text type="secondary">Loading…</Text>
        ) : (
          <>
            <Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{previewText}</pre>
            </Paragraph>
            <Divider />
            <Text type="secondary">Plain-text export generated by the Finalization service.</Text>
          </>
        )}
      </Drawer>

      {/* Consolidated preview */}
      <Drawer
        title="Consolidated SRS (Markdown Preview)"
        open={conPreviewOpen}
        onClose={() => setConPreviewOpen(false)}
        width={920}
      >
        {conLoading ? (
          <Text type="secondary">Loading…</Text>
        ) : (
          <>
            <Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{conPreviewText}</pre>
            </Paragraph>
            <Divider />
            <Space>
              <Button icon={<DownloadOutlined />} onClick={doDownloadConsolidated}>
                Export with Current Options
              </Button>
              <Text type="secondary">
                Tip: Switch output to DOCX/PDF for a polished handout. Use “Polish” to improve readability (IDs stay intact).
              </Text>
            </Space>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default FinalizePage;