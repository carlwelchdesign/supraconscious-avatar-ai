-- Admin reasoning graph tables for source-backed concept networks.

CREATE TABLE "ReasoningGraphRun" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "sourceScope" TEXT NOT NULL DEFAULT 'approved_sources',
    "sourceDocumentIds" TEXT[],
    "model" TEXT,
    "promptVersion" TEXT,
    "nodeCount" INTEGER NOT NULL DEFAULT 0,
    "edgeCount" INTEGER NOT NULL DEFAULT 0,
    "clusterCount" INTEGER NOT NULL DEFAULT 0,
    "insightCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReasoningGraphRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningGraphCluster" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "clusterKey" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningGraphCluster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningGraphNode" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "clusterId" TEXT,
    "nodeKey" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL DEFAULT 'concept',
    "label" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "summary" TEXT,
    "degree" INTEGER NOT NULL DEFAULT 0,
    "weightedDegree" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "betweenness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bridgeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewState" TEXT NOT NULL DEFAULT 'unreviewed',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningGraphNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningGraphEdge" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "edgeKey" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'co_occurs',
    "weight" INTEGER NOT NULL DEFAULT 1,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rationale" TEXT,
    "reviewState" TEXT NOT NULL DEFAULT 'unreviewed',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningGraphEdge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningGraphInsight" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewState" TEXT NOT NULL DEFAULT 'unreviewed',
    "nodeIds" JSONB,
    "edgeIds" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningGraphInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningGraphEvidence" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "nodeId" TEXT,
    "edgeId" TEXT,
    "insightId" TEXT,
    "sourceDocumentId" TEXT,
    "sourceChunkId" TEXT,
    "evidenceKind" TEXT NOT NULL DEFAULT 'source_chunk',
    "excerpt" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningGraphEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReasoningGraphCluster_runId_clusterKey_key" ON "ReasoningGraphCluster"("runId", "clusterKey");
CREATE UNIQUE INDEX "ReasoningGraphNode_runId_nodeKey_key" ON "ReasoningGraphNode"("runId", "nodeKey");
CREATE UNIQUE INDEX "ReasoningGraphEdge_runId_edgeKey_key" ON "ReasoningGraphEdge"("runId", "edgeKey");

CREATE INDEX "ReasoningGraphRun_createdById_idx" ON "ReasoningGraphRun"("createdById");
CREATE INDEX "ReasoningGraphRun_status_idx" ON "ReasoningGraphRun"("status");
CREATE INDEX "ReasoningGraphRun_createdAt_idx" ON "ReasoningGraphRun"("createdAt");
CREATE INDEX "ReasoningGraphCluster_runId_idx" ON "ReasoningGraphCluster"("runId");
CREATE INDEX "ReasoningGraphNode_runId_idx" ON "ReasoningGraphNode"("runId");
CREATE INDEX "ReasoningGraphNode_clusterId_idx" ON "ReasoningGraphNode"("clusterId");
CREATE INDEX "ReasoningGraphNode_nodeType_idx" ON "ReasoningGraphNode"("nodeType");
CREATE INDEX "ReasoningGraphNode_reviewState_idx" ON "ReasoningGraphNode"("reviewState");
CREATE INDEX "ReasoningGraphEdge_runId_idx" ON "ReasoningGraphEdge"("runId");
CREATE INDEX "ReasoningGraphEdge_fromNodeId_idx" ON "ReasoningGraphEdge"("fromNodeId");
CREATE INDEX "ReasoningGraphEdge_toNodeId_idx" ON "ReasoningGraphEdge"("toNodeId");
CREATE INDEX "ReasoningGraphEdge_relationType_idx" ON "ReasoningGraphEdge"("relationType");
CREATE INDEX "ReasoningGraphEdge_reviewState_idx" ON "ReasoningGraphEdge"("reviewState");
CREATE INDEX "ReasoningGraphInsight_runId_idx" ON "ReasoningGraphInsight"("runId");
CREATE INDEX "ReasoningGraphInsight_insightType_idx" ON "ReasoningGraphInsight"("insightType");
CREATE INDEX "ReasoningGraphInsight_reviewState_idx" ON "ReasoningGraphInsight"("reviewState");
CREATE INDEX "ReasoningGraphEvidence_runId_idx" ON "ReasoningGraphEvidence"("runId");
CREATE INDEX "ReasoningGraphEvidence_nodeId_idx" ON "ReasoningGraphEvidence"("nodeId");
CREATE INDEX "ReasoningGraphEvidence_edgeId_idx" ON "ReasoningGraphEvidence"("edgeId");
CREATE INDEX "ReasoningGraphEvidence_insightId_idx" ON "ReasoningGraphEvidence"("insightId");
CREATE INDEX "ReasoningGraphEvidence_sourceDocumentId_idx" ON "ReasoningGraphEvidence"("sourceDocumentId");
CREATE INDEX "ReasoningGraphEvidence_sourceChunkId_idx" ON "ReasoningGraphEvidence"("sourceChunkId");

ALTER TABLE "ReasoningGraphRun" ADD CONSTRAINT "ReasoningGraphRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphCluster" ADD CONSTRAINT "ReasoningGraphCluster_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReasoningGraphRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphNode" ADD CONSTRAINT "ReasoningGraphNode_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReasoningGraphRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphNode" ADD CONSTRAINT "ReasoningGraphNode_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ReasoningGraphCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEdge" ADD CONSTRAINT "ReasoningGraphEdge_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReasoningGraphRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEdge" ADD CONSTRAINT "ReasoningGraphEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "ReasoningGraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEdge" ADD CONSTRAINT "ReasoningGraphEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "ReasoningGraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphInsight" ADD CONSTRAINT "ReasoningGraphInsight_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReasoningGraphRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEvidence" ADD CONSTRAINT "ReasoningGraphEvidence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReasoningGraphRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEvidence" ADD CONSTRAINT "ReasoningGraphEvidence_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "ReasoningGraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEvidence" ADD CONSTRAINT "ReasoningGraphEvidence_edgeId_fkey" FOREIGN KEY ("edgeId") REFERENCES "ReasoningGraphEdge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEvidence" ADD CONSTRAINT "ReasoningGraphEvidence_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "ReasoningGraphInsight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEvidence" ADD CONSTRAINT "ReasoningGraphEvidence_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningGraphEvidence" ADD CONSTRAINT "ReasoningGraphEvidence_sourceChunkId_fkey" FOREIGN KEY ("sourceChunkId") REFERENCES "SourceChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
