import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Table,
  Typography,
  Card,
  Spin,
  Alert,
  Input,
  Tag,
  Tooltip,
  Select,
  Space,
  Button,
  InputNumber,
} from "antd";
import { SafetyOutlined, SearchOutlined, LinkOutlined, ReloadOutlined } from "@ant-design/icons";
import { getBlockchainLogs } from "../../services/adminService";

const { Title, Paragraph, Text } = Typography;

/* ----------------------------- types & helpers ----------------------------- */

type RawLog = {
  // common top-level
  network?: string;
  blockNumber?: number;
  address?: string;
  txHash?: string;
  transactionHash?: string;
  logIndex?: number;
  topic0?: string;
  topics?: string[];
  event?: string | null;
  args?: Record<string, any> | null;
  timestamp?: string | number;

  // sometimes the backend returns {decoded:{name,args}}
  decoded?: { name?: string; args?: Record<string, any> };
};

type UiLog = {
  key: string;
  index: number;
  network: string;
  blockNumber: number;
  transactionHash: string;
  address: string;
  topic0?: string;
  event?: string | null;
  proposalId?: string;
  negotiationId?: string;
  summaryId?: string;
  preferenceId?: string;
  finalProposalId?: string;
  smartDataId?: string;
  timestamp?: string; // ISO if known
  args?: Record<string, any> | null; // raw args for row expand
};

const clip = (val?: string, n = 10) => (val ? `${val.slice(0, n)}…` : "N/A");

const toISO = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === "number") {
    const ms = v < 2_000_000_000 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  return undefined;
};

/** Normalize any backend log shape into a single UI-friendly row */
const normalize = (rows: RawLog[] = []): UiLog[] =>
  rows.map((l, i) => {
    // prefer decoded form when available
    const decoded = l.decoded || {};
    const name = l.event ?? decoded.name ?? null;
    const args = l.args ?? decoded.args ?? null;

    const tx = l.txHash || l.transactionHash || "";
    const proposalId =
      (args as any)?.proposalId ||
      (args as any)?.proposalID ||
      (args as any)?.id ||
      "";
    const negotiationId = (args as any)?.negotiationId || "";
    const summaryId = (args as any)?.summaryId || "";
    const preferenceId = (args as any)?.preferenceId || "";
    const finalProposalId = (args as any)?.finalProposalId || "";
    const smartDataId = (args as any)?.smartDataId || "";

    const ts = toISO((args as any)?.timestamp) || toISO(l.timestamp);

    // topic0 may come as topic0 or topics[0]
    const topic0 = l.topic0 || (Array.isArray(l.topics) ? l.topics[0] : undefined);

    return {
      key: tx || `${l.blockNumber ?? 0}-${l.logIndex ?? i}`,
      index: i + 1,
      network: l.network || "sepolia",
      blockNumber: l.blockNumber ?? 0,
      transactionHash: tx,
      address: l.address || "",
      topic0,
      event: name,
      proposalId,
      negotiationId,
      summaryId,
      preferenceId,
      finalProposalId,
      smartDataId,
      timestamp: ts,
      args,
    };
  });

/* --------------------------------- page ---------------------------------- */

const BlockchainLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<UiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // quick filters
  const [network, setNetwork] = useState<"all" | "local" | "sepolia">("sepolia");
  const [lookback, setLookback] = useState<number>(10000);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resp: any = await getBlockchainLogs({
        network: network === "all" ? undefined : network,
        lookback,
      });

      const raw: RawLog[] = Array.isArray(resp) ? resp : resp?.logs || [];
      const norm = normalize(raw).sort(
        (a, b) =>
          b.blockNumber - a.blockNumber ||
          (b.transactionHash > a.transactionHash ? 1 : -1)
      );

      setLogs(norm);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch blockchain logs.");
    } finally {
      setLoading(false);
    }
  }, [network, lookback]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [
        l.network,
        String(l.blockNumber),
        l.transactionHash,
        l.address,
        l.topic0,
        l.event,
        l.proposalId,
        l.negotiationId,
        l.summaryId,
        l.preferenceId,
        l.finalProposalId,
        l.smartDataId,
        l.timestamp,
        JSON.stringify(l.args || {}),
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [logs, search]);

  const columns = [
    {
      title: "Block",
      dataIndex: "blockNumber",
      key: "blockNumber",
      sorter: (a: UiLog, b: UiLog) => a.blockNumber - b.blockNumber,
      width: 110,
      render: (b: number) =>
        b ? (
          <a
            href={`https://sepolia.etherscan.io/block/${b}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {b}
          </a>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Network",
      dataIndex: "network",
      key: "network",
      width: 100,
      render: (n: string) => <Tag color={n === "sepolia" ? "blue" : "default"}>{n}</Tag>,
      filters: [
        { text: "sepolia", value: "sepolia" },
        { text: "local", value: "local" },
      ],
      onFilter: (val: any, row: UiLog) => row.network === val,
    },
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
      width: 180,
      render: (ev?: string | null) => (ev ? <Tag color="green">{ev}</Tag> : <Tag>unknown</Tag>),
    },
    {
      title: "Proposal ID",
      dataIndex: "proposalId",
      key: "proposalId",
      ellipsis: true,
      render: (id?: string) =>
        id ? (
          <Tooltip title={id}>
            <Text copyable={{ text: id }}>{clip(id, 10)}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Negotiation ID",
      dataIndex: "negotiationId",
      key: "negotiationId",
      ellipsis: true,
      render: (id?: string) =>
        id ? (
          <Tooltip title={id}>
            <Tag color="purple">{clip(id, 10)}</Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Tx Hash",
      dataIndex: "transactionHash",
      key: "transactionHash",
      width: 280,
      render: (tx?: string) =>
        tx ? (
          <a href={`https://sepolia.etherscan.io/tx/${tx}`} target="_blank" rel="noopener noreferrer">
            {clip(tx, 16)} <LinkOutlined />
          </a>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Contract",
      dataIndex: "address",
      key: "address",
      width: 220,
      render: (addr?: string) =>
        addr ? (
          <Tooltip title={addr}>
            <Text copyable={{ text: addr }}>{clip(addr, 14)}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Topic0",
      dataIndex: "topic0",
      key: "topic0",
      width: 260,
      render: (t?: string) =>
        t ? (
          <Tooltip title={t}>
            <Text copyable={{ text: t }}>{clip(t, 18)}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 210,
      render: (iso?: string) => (iso ? new Date(iso).toLocaleString() : <Text type="secondary">N/A</Text>),
      sorter: (a: UiLog, b: UiLog) =>
        (a.timestamp ? Date.parse(a.timestamp) : 0) - (b.timestamp ? Date.parse(b.timestamp) : 0),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-inter">
      <Title level={2} className="text-gray-800 mb-2 flex items-center">
        <SafetyOutlined className="mr-3 text-blue-600" /> Blockchain Audit Logs
      </Title>
      <Paragraph type="secondary" className="text-gray-600 mb-6 max-w-3xl">
        Immutable on-chain records of proposal anchoring and related events.
      </Paragraph>

      <Card bordered={false} className="rounded-lg shadow-md">
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search by any field (tx, id, address, topic, event)…"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 380 }}
          />

          <Select
            value={network}
            onChange={(v) => setNetwork(v as any)}
            options={[
              { value: "sepolia", label: "sepolia" },
              { value: "local", label: "local" },
              { value: "all", label: "all" },
            ]}
            style={{ width: 140 }}
          />

          <span>Lookback (blocks):</span>
          <InputNumber
            min={100}
            max={200000}
            step={100}
            value={lookback}
            onChange={(v) => setLookback(Number(v || 0))}
            style={{ width: 140 }}
          />

          <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
            Refresh
          </Button>
        </Space>

        {loading ? (
          <div className="text-center py-20">
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon className="rounded-md" />
        ) : (
          <Table
            columns={columns as any}
            dataSource={filtered}
            rowKey={(r) => r.key}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            expandable={{
              expandedRowRender: (row: UiLog) => (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(row.args || {}, null, 2)}
                </pre>
              ),
              rowExpandable: (row) => !!row.args && Object.keys(row.args).length > 0,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default BlockchainLogsPage;
