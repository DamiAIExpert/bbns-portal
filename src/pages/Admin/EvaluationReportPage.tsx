// src/pages/Admin/EvaluationReportPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Spin,
  Alert,
  Select,
  Row,
  Col,
  Statistic,
  Button,
  Empty,
  Progress,
  App,
  Tooltip,
  Table,
  Space,
  Divider,
  Collapse,
  InputNumber,
} from "antd";
import {
  BarChartOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  SmileOutlined,
  CheckSquareOutlined,
  LikeOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getAllProposals, getEvaluationMetrics, downloadEvaluationReport } from "../../services/adminService";
import api from "../../services/api";
import type { Proposal } from "../../services/proposalService";
import type { EvaluationMetrics } from "../../services/adminService";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

/* ───────────────────────────────── Types ───────────────────────────────── */

type UIProposal = Proposal & {
  negotiationId?: string | null;
  status?: string;
  title: string;
  _id: string;
};

type EvalRow = {
  negotiationId: string;
  proposalTitles?: string;
  timeToConsensus: number | null; // seconds
  numberOfRounds: number;
  utilityGain: number;
  stakeholderSatisfaction: number | null; // 1..5
  resolutionSuccessRate: number; // %
  resolutionStability: number; // %
  decisionConsistency: number; // %
};

/* ────────────────────────────── Helpers ─────────────────────────────── */

const isFinalized = (status?: string) => {
  const s = (status || "").toLowerCase();
  return (
    s === "finalized" ||
    s === "final" ||
    s === "completed" ||
    s === "closed" ||
    s.includes("final")
  );
};

const safeAvg = (arr: (number | null | undefined)[]) => {
  const vals = arr.map((x) => (typeof x === "number" ? x : NaN)).filter((x) => !Number.isNaN(x));
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum / vals.length;
};

const pct = (v?: number | null) => (typeof v === "number" ? Math.max(0, Math.min(100, v)) : 0);

const toCsv = (rows: EvalRow[]) => {
  const headers = [
    "negotiationId",
    "proposalTitles",
    "timeToConsensus",
    "numberOfRounds",
    "utilityGain",
    "stakeholderSatisfaction",
    "resolutionSuccessRate",
    "resolutionStability",
    "decisionConsistency",
  ];
  const esc = (s: any) => {
    const str = s == null ? "" : String(s);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(",")].concat(
    rows.map((r) =>
      [
        r.negotiationId,
        r.proposalTitles ?? "",
        r.timeToConsensus ?? "",
        r.numberOfRounds ?? "",
        r.utilityGain ?? "",
        r.stakeholderSatisfaction ?? "",
        r.resolutionSuccessRate ?? "",
        r.resolutionStability ?? "",
        r.decisionConsistency ?? "",
      ]
        .map(esc)
        .join(",")
    )
  );
  return lines.join("\n");
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const tsStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(
    d.getMinutes()
  )}-${p(d.getSeconds())}`;
};

/* ────────────────────────────── Component ───────────────────────────── */

const EvaluationReportPage: React.FC = () => {
  const [proposals, setProposals] = useState<UIProposal[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<EvalRow[]>([]);
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);

  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  const [loadingAllEvals, setLoadingAllEvals] = useState<boolean>(true);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ttcMax, setTtcMax] = useState<number>(600); // for bar normalization (seconds)

  const { message } = App.useApp();

  const fetchProposals = useCallback(async () => {
    try {
      setLoadingProposals(true);
      setError(null);
      const fetched = (await getAllProposals()) as UIProposal[];
      setProposals(fetched || []);
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch proposals.";
      setError(msg);
      message.error(msg);
    } finally {
      setLoadingProposals(false);
    }
  }, [message]);

  const fetchAllEvaluations = useCallback(async () => {
    try {
      setLoadingAllEvals(true);
      setError(null);
      // Prefer the aggregate endpoint which returns a list
      const { data } = await api.get<{ evaluations: EvalRow[] }>("/evaluation", {
        headers: { "Cache-Control": "no-cache" },
      });
      setAllEvaluations(data?.evaluations || []);
    } catch (err: any) {
      // best-effort: keep UI functional without global table
      setAllEvaluations([]);
    } finally {
      setLoadingAllEvals(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchProposals();
      await fetchAllEvaluations();
    })();
  }, [fetchProposals, fetchAllEvaluations]);

  const finalizedOptions = useMemo(() => {
    const eligible = (proposals || []).filter((p) => isFinalized(p.status) && !!p?.negotiationId);
    return eligible.map((p) => ({
      value: String(p.negotiationId),
      label: p.title || `Negotiation ${String(p.negotiationId).slice(-6)}`,
    }));
  }, [proposals]);

  const fallbackOptions = useMemo(() => {
    if (!allEvaluations?.length) return [];
    return allEvaluations.map((e) => ({
      value: e.negotiationId,
      label: e.proposalTitles || `Negotiation ${e.negotiationId.slice(-6)}`,
    }));
  }, [allEvaluations]);

  const selectOptions = finalizedOptions.length > 0 ? finalizedOptions : fallbackOptions;
  const hasOptions = selectOptions.length > 0;

  const handleSelect = async (negotiationId?: string) => {
    if (!negotiationId) {
      setSelectedNegotiationId(null);
      setMetrics(null);
      setError(null);
      return;
    }
    setSelectedNegotiationId(negotiationId);
    setMetrics(null);
    setError(null);

    try {
      setLoadingMetrics(true);
      const fetched = await getEvaluationMetrics(negotiationId);
      setMetrics(fetched);
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch evaluation metrics.";
      setError(msg);
      message.error(msg);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleDownloadFull = async () => {
    try {
      setDownloading(true);
      message.loading({ content: "Preparing full report…", key: "dl", duration: 0 });
      await downloadEvaluationReport(); // server CSV
      message.success({ content: "Full report download started!", key: "dl", duration: 2 });
    } catch (err: any) {
      message.error({ content: err?.message || "Failed to download report.", key: "dl" });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVisible = () => {
    if (!allEvaluations?.length) {
      message.info("No evaluations to export.");
      return;
    }
    const csv = toCsv(allEvaluations);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `evaluations_visible_${tsStamp()}.csv`);
  };

  /* ──────────────── Aggregates across all evaluations (KPI cards) ──────────────── */

  const kpis = useMemo(() => {
    if (!allEvaluations?.length) {
      return {
        avgTtc: null,
        avgRounds: null,
        avgUtility: null,
        avgSss: null,
        avgSuccess: null,
        avgStability: null,
        avgConsistency: null,
        count: 0,
      };
    }
    return {
      avgTtc: safeAvg(allEvaluations.map((e) => e.timeToConsensus)),
      avgRounds: safeAvg(allEvaluations.map((e) => e.numberOfRounds)),
      avgUtility: safeAvg(allEvaluations.map((e) => e.utilityGain)),
      avgSss: safeAvg(allEvaluations.map((e) => e.stakeholderSatisfaction)),
      avgSuccess: safeAvg(allEvaluations.map((e) => e.resolutionSuccessRate)),
      avgStability: safeAvg(allEvaluations.map((e) => e.resolutionStability)),
      avgConsistency: safeAvg(allEvaluations.map((e) => e.decisionConsistency)),
      count: allEvaluations.length,
    };
  }, [allEvaluations]);

  /* ────────────────────── Table of all evaluations ───────────────────── */

  const columns = [
    { title: "Negotiation", dataIndex: "negotiationId", key: "negotiationId", width: 220 },
    { title: "Proposal(s)", dataIndex: "proposalTitles", key: "proposalTitles", ellipsis: true },
    {
      title: "TTC (sec)",
      dataIndex: "timeToConsensus",
      key: "timeToConsensus",
      width: 140,
      render: (v: number | null) =>
        typeof v === "number" ? (
          <Space size="small">
            <Text>{v}</Text>
            <Progress
              percent={pct((v / (ttcMax || 1)) * 100)}
              size="small"
              showInfo={false}
              style={{ width: 90 }}
            />
          </Space>
        ) : (
          "N/A"
        ),
      sorter: (a: EvalRow, b: EvalRow) => (a.timeToConsensus || 0) - (b.timeToConsensus || 0),
    },
    {
      title: "Rounds",
      dataIndex: "numberOfRounds",
      key: "numberOfRounds",
      width: 120,
      render: (v: number) => (
        <Space size="small">
          <Text>{v}</Text>
          <Progress percent={pct((v / 10) * 100)} size="small" showInfo={false} style={{ width: 90 }} />
        </Space>
      ),
      sorter: (a: EvalRow, b: EvalRow) => a.numberOfRounds - b.numberOfRounds,
    },
    {
      title: "Utility Gain",
      dataIndex: "utilityGain",
      key: "utilityGain",
      width: 140,
      render: (v: number) => <Text>{typeof v === "number" ? v.toFixed(3) : "N/A"}</Text>,
      sorter: (a: EvalRow, b: EvalRow) => a.utilityGain - b.utilityGain,
    },
    {
      title: "Satisfaction",
      dataIndex: "stakeholderSatisfaction",
      key: "stakeholderSatisfaction",
      width: 150,
      render: (v: number | null) =>
        typeof v === "number" ? (
          <Space size="small">
            <Text>{v.toFixed(2)} / 5</Text>
            <Progress percent={pct((v / 5) * 100)} size="small" showInfo={false} style={{ width: 90 }} />
          </Space>
        ) : (
          "N/A"
        ),
      sorter: (a: EvalRow, b: EvalRow) => (a.stakeholderSatisfaction || 0) - (b.stakeholderSatisfaction || 0),
    },
    {
      title: "Success %",
      dataIndex: "resolutionSuccessRate",
      key: "resolutionSuccessRate",
      width: 130,
      render: (v: number) => <Progress percent={pct(v)} size="small" />,
      sorter: (a: EvalRow, b: EvalRow) => a.resolutionSuccessRate - b.resolutionSuccessRate,
    },
    {
      title: "Stability %",
      dataIndex: "resolutionStability",
      key: "resolutionStability",
      width: 130,
      render: (v: number) => <Progress percent={pct(v)} size="small" />,
      sorter: (a: EvalRow, b: EvalRow) => a.resolutionStability - b.resolutionStability,
    },
    {
      title: "Consistency %",
      dataIndex: "decisionConsistency",
      key: "decisionConsistency",
      width: 140,
      render: (v: number) => <Progress percent={pct(v)} size="small" />,
      sorter: (a: EvalRow, b: EvalRow) => a.decisionConsistency - b.decisionConsistency,
    },
  ];

  /* ────────────────────────────── UI Blocks ───────────────────────────── */

  const renderSelectedMetrics = () => {
    if (loadingMetrics) {
      return (
        <div className="text-center py-20">
          <Spin size="large" />
          <Paragraph className="mt-4 text-gray-500">Loading Evaluation Metrics...</Paragraph>
        </div>
      );
    }

    if (!selectedNegotiationId) {
      return (
        <div className="text-center py-16">
          <Empty
            description={
              <span className="text-gray-500">
                {hasOptions
                  ? "Please select a proposal to view its evaluation metrics."
                  : "No finalized proposals are available for evaluation yet."}
              </span>
            }
          />
        </div>
      );
    }

    if (!metrics) return null;

    const m = metrics;
    const ttcPct = m.timeToConsensus ? Math.min(100, (m.timeToConsensus / (ttcMax || 1)) * 100) : 0;

    return (
      <>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm rounded-lg h-full">
              <Statistic
                title="Time to Consensus (sec)"
                value={m.timeToConsensus ?? "N/A"}
                prefix={<ClockCircleOutlined />}
              />
              <Progress className="mt-2" percent={pct(ttcPct)} showInfo={false} />
              <div className="text-xs text-gray-500 mt-1">Normalized by TTC max: {ttcMax}s</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm rounded-lg h-full">
              <Statistic title="Negotiation Rounds" value={m.numberOfRounds} prefix={<SyncOutlined />} />
              <Progress className="mt-2" percent={pct((m.numberOfRounds / 10) * 100)} showInfo={false} />
              <div className="text-xs text-gray-500 mt-1">Scale heuristic: 10 rounds</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm rounded-lg h-full">
              <Statistic title="Utility Gain" value={m.utilityGain} precision={3} prefix={<ArrowUpOutlined />} />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm rounded-lg h-full">
              <Statistic
                title="Stakeholder Satisfaction"
                value={m.stakeholderSatisfaction ?? "N/A"}
                precision={2}
                prefix={<SmileOutlined />}
                suffix="/ 5"
              />
              <Progress
                className="mt-2"
                percent={pct(((m.stakeholderSatisfaction || 0) / 5) * 100)}
                showInfo={false}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm rounded-lg h-full">
              <Statistic
                title="Resolution Success Rate"
                value={m.resolutionSuccessRate}
                suffix="%"
                prefix={<CheckSquareOutlined />}
              />
              <Progress className="mt-2" percent={pct(m.resolutionSuccessRate)} showInfo />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm rounded-lg h-full">
              <Statistic
                title="Decision Consistency"
                value={m.decisionConsistency}
                suffix="%"
                prefix={<LikeOutlined />}
              />
              <Progress className="mt-2" percent={pct(m.decisionConsistency)} showInfo />
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const formulas = (
    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`Formulas (notation shown for clarity):

1) Time to consensus (TTC)
   TTC = t_final - t_start  (seconds)

2) Number of negotiation rounds (NRC)
   NRC = total rounds executed

3) Utility gain (UG)
   UG = (U_final - U_initial) / max( |U_initial|, 1 )

4) Stakeholder satisfaction (SSS)
   SSS = mean_i ( rating_i ), typically on 1..5 scale

5) Resolution success rate (RSR)
   RSR (%) = 100 * (#finalized) / (#total)

6) Resolution stability (RST)
   RST (%) = 100 * ( #agreements not reopened in window ) / (#agreements in window)

7) Decision consistency (DC)
   DC (%) = 100 * (#decisions aligned with preferences) / (#decisions)
`}</pre>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-inter">
      <Title level={2} className="text-gray-800 mb-2 flex items-center">
        <BarChartOutlined className="mr-3 text-blue-600" /> Evaluation Reports
      </Title>
      <Paragraph type="secondary" className="text-gray-600 mb-8 max-w-3xl">
        Analyze the performance and effectiveness of the negotiation process for finalized proposals.
      </Paragraph>

      {/* Controls */}
      <Card bordered={false} className="rounded-lg shadow-md">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16} lg={12}>
            <Select
              showSearch
              allowClear
              value={selectedNegotiationId ?? undefined}
              placeholder={
                loadingProposals
                  ? "Loading proposals..."
                  : hasOptions
                  ? "Select a finalized proposal"
                  : "No eligible finalized proposals found"
              }
              className="w-full"
              onChange={handleSelect}
              loading={loadingProposals}
              disabled={loadingProposals || !hasOptions}
              notFoundContent={loadingProposals ? <Spin size="small" /> : "No eligible finalized proposals"}
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase()?.includes(input.toLowerCase())
              }
            >
              {selectOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8} lg={12} className="text-right">
            <Row gutter={[8, 8]} justify="end">
              <Col>
                <Space>
                  <Tooltip title="Normalization cap for TTC progress bars (seconds)">
                    <InfoCircleOutlined />
                  </Tooltip>
                  <span>TTC max:</span>
                  <InputNumber
                    min={60}
                    max={7200}
                    step={30}
                    value={ttcMax}
                    onChange={(v) => setTtcMax(Number(v || 0))}
                    style={{ width: 110 }}
                  />
                </Space>
              </Col>
              <Col>
                <Button icon={<ReloadOutlined />} onClick={() => { fetchProposals(); fetchAllEvaluations(); }}>
                  Refresh
                </Button>
              </Col>
              <Col>
                <Button type="default" icon={<DownloadOutlined />} onClick={handleDownloadVisible}>
                  Download Visible (CSV)
                </Button>
              </Col>
              <Col>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadFull} loading={downloading}>
                  Download Full Report (CSV)
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* KPI summary (averages across all evaluations) */}
      <Divider />
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-lg h-full">
            <Statistic title="Avg. TTC (sec)" value={kpis.avgTtc ?? "N/A"} precision={kpis.avgTtc ? 1 : 0} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-lg h-full">
            <Statistic title="Avg. Rounds" value={kpis.avgRounds ?? "N/A"} precision={kpis.avgRounds ? 1 : 0} prefix={<SyncOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-lg h-full">
            <Statistic title="Avg. Utility Gain" value={kpis.avgUtility ?? "N/A"} precision={kpis.avgUtility ? 3 : 0} prefix={<ArrowUpOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-lg h-full">
            <Statistic title="Avg. Satisfaction" value={kpis.avgSss ?? "N/A"} precision={2} prefix={<SmileOutlined />} suffix="/ 5" />
            <Progress className="mt-2" percent={pct(((kpis.avgSss || 0) / 5) * 100)} showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-lg h-full">
            <Statistic title="Avg. Success Rate" value={kpis.avgSuccess ?? "N/A"} suffix="%" prefix={<CheckSquareOutlined />} />
            <Progress className="mt-2" percent={pct(kpis.avgSuccess || 0)} showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="shadow-sm rounded-lg h-full">
            <Statistic title="Avg. Consistency" value={kpis.avgConsistency ?? "N/A"} suffix="%" prefix={<LikeOutlined />} />
            <Progress className="mt-2" percent={pct(kpis.avgConsistency || 0)} showInfo={false} />
          </Card>
        </Col>
      </Row>

      {/* Selected negotiation metrics */}
      <Divider />
      {error && !metrics ? (
        <Alert message="Error" description={error} type="error" showIcon className="mt-6 rounded-lg" />
      ) : (
        renderSelectedMetrics()
      )}

      {/* All evaluations table */}
      <Divider />
      <Card bordered={false} className="rounded-lg shadow-sm">
        <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
          <Col>
            <Text strong>All Evaluations ({allEvaluations.length})</Text>
          </Col>
        </Row>
        {loadingAllEvals ? (
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        ) : allEvaluations.length === 0 ? (
          <Empty description="No evaluation records found." />
        ) : (
          <Table
            rowKey={(r) => r.negotiationId}
            dataSource={allEvaluations}
            columns={columns as any}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>

      {/* Formulas / methodology */}
      <Divider />
      <Collapse
        items={[
          {
            key: "formulas",
            label: (
              <Space>
                <InfoCircleOutlined />
                <span>Formulas & Methodology</span>
              </Space>
            ),
            children: formulas,
          },
        ]}
      />
    </div>
  );
};

export default EvaluationReportPage;
