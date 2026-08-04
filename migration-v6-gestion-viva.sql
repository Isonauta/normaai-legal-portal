-- migration-v6-gestion-viva.sql
-- Ejecutar en Supabase → SQL Editor
-- Habilita gestión viva de cumplimiento (Phase 1)

-- Tabla principal: un requisito por artículo de ley
CREATE TABLE IF NOT EXISTS normaai_requisitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  matriz_id UUID REFERENCES normaai_matrices(id) ON DELETE SET NULL,
  empresa TEXT NOT NULL,
  pais TEXT DEFAULT 'CL',                    -- 'CL' | 'PE' | 'AR' etc.
  cuerpo_legal TEXT NOT NULL,
  articulo TEXT,
  descripcion TEXT,
  -- Campos editables por el cliente
  cumple TEXT DEFAULT 'PENDIENTE'
    CHECK (cumple IN ('SI','NO','PENDIENTE','NO_APLICA')),
  responsable TEXT,
  forma_cumplimiento TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planes de acción por requisito
CREATE TABLE IF NOT EXISTS normaai_planes_accion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisito_id UUID NOT NULL REFERENCES normaai_requisitos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  accion TEXT NOT NULL,
  responsable TEXT,
  fecha_limite DATE,
  estado TEXT DEFAULT 'ABIERTO'
    CHECK (estado IN ('ABIERTO','EN_CURSO','CERRADO','VENCIDO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_req_user    ON normaai_requisitos(user_id);
CREATE INDEX IF NOT EXISTS idx_req_cumple  ON normaai_requisitos(cumple);
CREATE INDEX IF NOT EXISTS idx_planes_req  ON normaai_planes_accion(requisito_id);
