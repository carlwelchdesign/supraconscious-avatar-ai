-- Durable reasoning ontology curated from generated reasoning graph candidates.

CREATE TABLE "ReasoningOntologyConcept" (
    "id" TEXT NOT NULL,
    "conceptKey" TEXT NOT NULL,
    "canonicalLabel" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "reviewState" TEXT NOT NULL DEFAULT 'approved',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "sourceGraphNodeId" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningOntologyConcept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningOntologyRelationship" (
    "id" TEXT NOT NULL,
    "relationshipKey" TEXT NOT NULL,
    "fromConceptId" TEXT NOT NULL,
    "toConceptId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "rationale" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewState" TEXT NOT NULL DEFAULT 'approved',
    "sourceGraphEdgeId" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningOntologyRelationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningOntologyCluster" (
    "id" TEXT NOT NULL,
    "clusterKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT,
    "reviewState" TEXT NOT NULL DEFAULT 'approved',
    "sourceGraphClusterId" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningOntologyCluster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningOntologyClusterConcept" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningOntologyClusterConcept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningOntologyOutcome" (
    "id" TEXT NOT NULL,
    "outcomeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT,
    "missingAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewState" TEXT NOT NULL DEFAULT 'approved',
    "sourceGraphInsightId" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningOntologyOutcome_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningOntologyOutcomeConcept" (
    "id" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'supports',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningOntologyOutcomeConcept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReasoningOntologyEvidence" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT,
    "relationshipId" TEXT,
    "clusterId" TEXT,
    "outcomeId" TEXT,
    "sourceDocumentId" TEXT,
    "sourceChunkId" TEXT,
    "evidenceKind" TEXT NOT NULL DEFAULT 'source_chunk',
    "excerpt" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningOntologyEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReasoningOntologyConcept_conceptKey_key" ON "ReasoningOntologyConcept"("conceptKey");
CREATE INDEX "ReasoningOntologyConcept_conceptKey_idx" ON "ReasoningOntologyConcept"("conceptKey");
CREATE INDEX "ReasoningOntologyConcept_reviewState_idx" ON "ReasoningOntologyConcept"("reviewState");
CREATE INDEX "ReasoningOntologyConcept_pinned_idx" ON "ReasoningOntologyConcept"("pinned");
CREATE INDEX "ReasoningOntologyConcept_sourceGraphNodeId_idx" ON "ReasoningOntologyConcept"("sourceGraphNodeId");
CREATE INDEX "ReasoningOntologyConcept_createdById_idx" ON "ReasoningOntologyConcept"("createdById");

CREATE UNIQUE INDEX "ReasoningOntologyRelationship_relationshipKey_key" ON "ReasoningOntologyRelationship"("relationshipKey");
CREATE INDEX "ReasoningOntologyRelationship_fromConceptId_idx" ON "ReasoningOntologyRelationship"("fromConceptId");
CREATE INDEX "ReasoningOntologyRelationship_toConceptId_idx" ON "ReasoningOntologyRelationship"("toConceptId");
CREATE INDEX "ReasoningOntologyRelationship_relationType_idx" ON "ReasoningOntologyRelationship"("relationType");
CREATE INDEX "ReasoningOntologyRelationship_reviewState_idx" ON "ReasoningOntologyRelationship"("reviewState");
CREATE INDEX "ReasoningOntologyRelationship_sourceGraphEdgeId_idx" ON "ReasoningOntologyRelationship"("sourceGraphEdgeId");
CREATE INDEX "ReasoningOntologyRelationship_createdById_idx" ON "ReasoningOntologyRelationship"("createdById");

CREATE UNIQUE INDEX "ReasoningOntologyCluster_clusterKey_key" ON "ReasoningOntologyCluster"("clusterKey");
CREATE INDEX "ReasoningOntologyCluster_reviewState_idx" ON "ReasoningOntologyCluster"("reviewState");
CREATE INDEX "ReasoningOntologyCluster_sourceGraphClusterId_idx" ON "ReasoningOntologyCluster"("sourceGraphClusterId");
CREATE INDEX "ReasoningOntologyCluster_createdById_idx" ON "ReasoningOntologyCluster"("createdById");

CREATE UNIQUE INDEX "ReasoningOntologyClusterConcept_clusterId_conceptId_key" ON "ReasoningOntologyClusterConcept"("clusterId", "conceptId");
CREATE INDEX "ReasoningOntologyClusterConcept_conceptId_idx" ON "ReasoningOntologyClusterConcept"("conceptId");

CREATE UNIQUE INDEX "ReasoningOntologyOutcome_outcomeKey_key" ON "ReasoningOntologyOutcome"("outcomeKey");
CREATE INDEX "ReasoningOntologyOutcome_reviewState_idx" ON "ReasoningOntologyOutcome"("reviewState");
CREATE INDEX "ReasoningOntologyOutcome_sourceGraphInsightId_idx" ON "ReasoningOntologyOutcome"("sourceGraphInsightId");
CREATE INDEX "ReasoningOntologyOutcome_createdById_idx" ON "ReasoningOntologyOutcome"("createdById");

CREATE UNIQUE INDEX "ReasoningOntologyOutcomeConcept_outcomeId_conceptId_role_key" ON "ReasoningOntologyOutcomeConcept"("outcomeId", "conceptId", "role");
CREATE INDEX "ReasoningOntologyOutcomeConcept_conceptId_idx" ON "ReasoningOntologyOutcomeConcept"("conceptId");

CREATE INDEX "ReasoningOntologyEvidence_conceptId_idx" ON "ReasoningOntologyEvidence"("conceptId");
CREATE INDEX "ReasoningOntologyEvidence_relationshipId_idx" ON "ReasoningOntologyEvidence"("relationshipId");
CREATE INDEX "ReasoningOntologyEvidence_clusterId_idx" ON "ReasoningOntologyEvidence"("clusterId");
CREATE INDEX "ReasoningOntologyEvidence_outcomeId_idx" ON "ReasoningOntologyEvidence"("outcomeId");
CREATE INDEX "ReasoningOntologyEvidence_sourceDocumentId_idx" ON "ReasoningOntologyEvidence"("sourceDocumentId");
CREATE INDEX "ReasoningOntologyEvidence_sourceChunkId_idx" ON "ReasoningOntologyEvidence"("sourceChunkId");

ALTER TABLE "ReasoningOntologyConcept" ADD CONSTRAINT "ReasoningOntologyConcept_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyConcept" ADD CONSTRAINT "ReasoningOntologyConcept_sourceGraphNodeId_fkey" FOREIGN KEY ("sourceGraphNodeId") REFERENCES "ReasoningGraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReasoningOntologyRelationship" ADD CONSTRAINT "ReasoningOntologyRelationship_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyRelationship" ADD CONSTRAINT "ReasoningOntologyRelationship_fromConceptId_fkey" FOREIGN KEY ("fromConceptId") REFERENCES "ReasoningOntologyConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyRelationship" ADD CONSTRAINT "ReasoningOntologyRelationship_toConceptId_fkey" FOREIGN KEY ("toConceptId") REFERENCES "ReasoningOntologyConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyRelationship" ADD CONSTRAINT "ReasoningOntologyRelationship_sourceGraphEdgeId_fkey" FOREIGN KEY ("sourceGraphEdgeId") REFERENCES "ReasoningGraphEdge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReasoningOntologyCluster" ADD CONSTRAINT "ReasoningOntologyCluster_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyCluster" ADD CONSTRAINT "ReasoningOntologyCluster_sourceGraphClusterId_fkey" FOREIGN KEY ("sourceGraphClusterId") REFERENCES "ReasoningGraphCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyClusterConcept" ADD CONSTRAINT "ReasoningOntologyClusterConcept_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ReasoningOntologyCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyClusterConcept" ADD CONSTRAINT "ReasoningOntologyClusterConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "ReasoningOntologyConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReasoningOntologyOutcome" ADD CONSTRAINT "ReasoningOntologyOutcome_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyOutcome" ADD CONSTRAINT "ReasoningOntologyOutcome_sourceGraphInsightId_fkey" FOREIGN KEY ("sourceGraphInsightId") REFERENCES "ReasoningGraphInsight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyOutcomeConcept" ADD CONSTRAINT "ReasoningOntologyOutcomeConcept_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "ReasoningOntologyOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyOutcomeConcept" ADD CONSTRAINT "ReasoningOntologyOutcomeConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "ReasoningOntologyConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReasoningOntologyEvidence" ADD CONSTRAINT "ReasoningOntologyEvidence_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "ReasoningOntologyConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyEvidence" ADD CONSTRAINT "ReasoningOntologyEvidence_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "ReasoningOntologyRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyEvidence" ADD CONSTRAINT "ReasoningOntologyEvidence_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ReasoningOntologyCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyEvidence" ADD CONSTRAINT "ReasoningOntologyEvidence_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "ReasoningOntologyOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyEvidence" ADD CONSTRAINT "ReasoningOntologyEvidence_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReasoningOntologyEvidence" ADD CONSTRAINT "ReasoningOntologyEvidence_sourceChunkId_fkey" FOREIGN KEY ("sourceChunkId") REFERENCES "SourceChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
