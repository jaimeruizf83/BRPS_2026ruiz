export type V3LevelKey = "none" | "very_low" | "low" | "medium" | "high" | "very_high";
export type V3BaremoBand = { from: number; to: number; level: string; key: V3LevelKey };

// Extracted from Aplicativo_Bateria_Riesgo_Psicosocial_v3.xlsx (BAREMOS).
// Keep synchronized with the official manuals before changing thresholds.
export const V3_BAREMOS = {
  "A_DIM_liderazgo": [
    {
      "from": 0,
      "to": 3.8,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 3.9,
      "to": 15.4,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 15.5,
      "to": 30.8,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 30.9,
      "to": 46.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 46.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_relaciones": [
    {
      "from": 0,
      "to": 5.4,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 5.5,
      "to": 16.1,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 16.2,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 37.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_retroalimentacion": [
    {
      "from": 0,
      "to": 10,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 10.1,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 40,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 40.1,
      "to": 55,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 55.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_colaboradores": [
    {
      "from": 0,
      "to": 13.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 14,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 33.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 33.4,
      "to": 47.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 47.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_rol": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 10.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 10.8,
      "to": 21.4,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 21.5,
      "to": 39.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 39.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_capacitacion": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 16.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 16.8,
      "to": 33.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 33.4,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_participacion": [
    {
      "from": 0,
      "to": 12.5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 12.6,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 37.6,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_habilidades": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 6.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 6.4,
      "to": 18.8,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 18.9,
      "to": 31.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 31.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_autonomia": [
    {
      "from": 0,
      "to": 8.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 8.4,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 41.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 41.8,
      "to": 58.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 58.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_ambientales": [
    {
      "from": 0,
      "to": 14.6,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 14.7,
      "to": 22.9,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 23,
      "to": 31.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 31.4,
      "to": 39.6,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 39.7,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_emocionales": [
    {
      "from": 0,
      "to": 16.7,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 16.8,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 33.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 33.4,
      "to": 47.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 47.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_cuantitativas": [
    {
      "from": 0,
      "to": 25,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 25.1,
      "to": 33.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 33.4,
      "to": 45.8,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 45.9,
      "to": 54.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 54.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_influencia": [
    {
      "from": 0,
      "to": 18.8,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 18.9,
      "to": 31.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 31.4,
      "to": 43.8,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 43.9,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_responsabilidad": [
    {
      "from": 0,
      "to": 37.5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 37.6,
      "to": 54.2,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 54.3,
      "to": 66.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 66.8,
      "to": 79.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 79.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_mental": [
    {
      "from": 0,
      "to": 60,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 60.1,
      "to": 70,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 70.1,
      "to": 80,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 80.1,
      "to": 90,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 90.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_consistencia": [
    {
      "from": 0,
      "to": 15,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 15.1,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 35,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 35.1,
      "to": 45,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 45.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_jornada": [
    {
      "from": 0,
      "to": 8.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 8.4,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 33.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 33.4,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_pertenencia": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 5.1,
      "to": 10,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 10.1,
      "to": 20,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 20.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DIM_reconocimiento": [
    {
      "from": 0,
      "to": 4.2,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 4.3,
      "to": 16.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 16.8,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 37.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_liderazgo": [
    {
      "from": 0,
      "to": 3.8,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 3.9,
      "to": 13.5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 13.6,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 38.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 38.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_relaciones": [
    {
      "from": 0,
      "to": 6.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 6.4,
      "to": 14.6,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 14.7,
      "to": 27.1,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 27.2,
      "to": 37.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 37.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_retroalimentacion": [
    {
      "from": 0,
      "to": 5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 5.1,
      "to": 20,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 20.1,
      "to": 30,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 30.1,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_rol": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 5.1,
      "to": 15,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 15.1,
      "to": 30,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 30.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_capacitacion": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 16.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 16.8,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_participacion": [
    {
      "from": 0,
      "to": 16.7,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 16.8,
      "to": 33.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 33.4,
      "to": 41.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 41.8,
      "to": 58.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 58.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_habilidades": [
    {
      "from": 0,
      "to": 12.5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 12.6,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 37.6,
      "to": 56.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 56.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_autonomia": [
    {
      "from": 0,
      "to": 33.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 33.4,
      "to": 50,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 50.1,
      "to": 66.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 66.8,
      "to": 75,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 75.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_ambientales": [
    {
      "from": 0,
      "to": 22.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 23,
      "to": 31.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 31.4,
      "to": 39.6,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 39.7,
      "to": 47.9,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 48,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_emocionales": [
    {
      "from": 0,
      "to": 19.4,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 19.5,
      "to": 27.8,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 27.9,
      "to": 38.9,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 39,
      "to": 47.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 47.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_cuantitativas": [
    {
      "from": 0,
      "to": 16.7,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 16.8,
      "to": 33.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 33.4,
      "to": 41.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 41.8,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_influencia": [
    {
      "from": 0,
      "to": 12.5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 12.6,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 31.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 31.4,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_mental": [
    {
      "from": 0,
      "to": 50,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 50.1,
      "to": 65,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 65.1,
      "to": 75,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 75.1,
      "to": 85,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 85.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_jornada": [
    {
      "from": 0,
      "to": 25,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 37.6,
      "to": 45.8,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 45.9,
      "to": 58.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 58.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_pertenencia": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 6.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 6.4,
      "to": 12.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 12.6,
      "to": 18.8,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 18.9,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DIM_reconocimiento": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 12.5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 12.6,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 37.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DOM_liderazgo_social": [
    {
      "from": 0,
      "to": 9.1,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 9.2,
      "to": 17.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 17.8,
      "to": 25.6,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.7,
      "to": 34.8,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 34.9,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DOM_control": [
    {
      "from": 0,
      "to": 10.7,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 10.8,
      "to": 19,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 19.1,
      "to": 29.8,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 29.9,
      "to": 40.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 40.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DOM_demandas": [
    {
      "from": 0,
      "to": 28.5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 28.6,
      "to": 35,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 35.1,
      "to": 41.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 41.6,
      "to": 47.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 47.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_DOM_recompensas": [
    {
      "from": 0,
      "to": 4.5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 4.6,
      "to": 11.4,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 11.5,
      "to": 20.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 20.6,
      "to": 29.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 29.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DOM_liderazgo_social": [
    {
      "from": 0,
      "to": 8.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 8.4,
      "to": 17.5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 17.6,
      "to": 26.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 26.8,
      "to": 38.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 38.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DOM_control": [
    {
      "from": 0,
      "to": 19.4,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 19.5,
      "to": 26.4,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 26.5,
      "to": 34.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 34.8,
      "to": 43.1,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 43.2,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DOM_demandas": [
    {
      "from": 0,
      "to": 26.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 27,
      "to": 33.3,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 33.4,
      "to": 37.8,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 37.9,
      "to": 44.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 44.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_DOM_recompensas": [
    {
      "from": 0,
      "to": 2.5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 2.6,
      "to": 10,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 10.1,
      "to": 17.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 17.6,
      "to": 27.5,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 27.6,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "A_TOTAL": [
    {
      "from": 0,
      "to": 19.7,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 19.8,
      "to": 25.8,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.9,
      "to": 31.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 31.6,
      "to": 38,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 38.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "B_TOTAL": [
    {
      "from": 0,
      "to": 20.6,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 20.7,
      "to": 26,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 26.1,
      "to": 31.2,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 31.3,
      "to": 38.7,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 38.8,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_balance": [
    {
      "from": 0,
      "to": 6.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 6.4,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 37.6,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_balance": [
    {
      "from": 0,
      "to": 6.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 6.4,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 37.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 37.6,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_familia": [
    {
      "from": 0,
      "to": 8.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 8.4,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 33.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 33.4,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_familia": [
    {
      "from": 0,
      "to": 8.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 8.4,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 33.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 33.4,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_comunicacion": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 10,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 10.1,
      "to": 20,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 20.1,
      "to": 30,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 30.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_comunicacion": [
    {
      "from": 0,
      "to": 5,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 5.1,
      "to": 15,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 15.1,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 35,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 35.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_economia": [
    {
      "from": 0,
      "to": 8.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 8.4,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 33.3,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 33.4,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_economia": [
    {
      "from": 0,
      "to": 16.7,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 16.8,
      "to": 25,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 25.1,
      "to": 41.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 41.8,
      "to": 50,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 50.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_vivienda": [
    {
      "from": 0,
      "to": 5.6,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 5.7,
      "to": 11.1,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 11.2,
      "to": 13.9,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 14,
      "to": 22.2,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 22.3,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_vivienda": [
    {
      "from": 0,
      "to": 5.6,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 5.7,
      "to": 11.1,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 11.2,
      "to": 16.7,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 16.8,
      "to": 27.8,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 27.9,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_influencia_ext": [
    {
      "from": 0,
      "to": 8.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 8.4,
      "to": 16.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 16.8,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 41.7,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 41.8,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_influencia_ext": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 16.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 16.8,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 41.7,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 41.8,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_desplazamiento": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 12.5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 12.6,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 43.8,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 43.9,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_desplazamiento": [
    {
      "from": 0,
      "to": 0.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 1,
      "to": 12.5,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 12.6,
      "to": 25,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 25.1,
      "to": 43.8,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 43.9,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_JPT_TOTAL": [
    {
      "from": 0,
      "to": 11.3,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 11.4,
      "to": 16.9,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 17,
      "to": 22.6,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 22.7,
      "to": 29,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 29.1,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EXT_AO_TOTAL": [
    {
      "from": 0,
      "to": 12.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 13,
      "to": 17.7,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 17.8,
      "to": 24.2,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 24.3,
      "to": 32.3,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 32.4,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "EST_JPT": [
    {
      "from": 0,
      "to": 7.8,
      "level": "Muy bajo",
      "key": "very_low"
    },
    {
      "from": 7.9,
      "to": 12.6,
      "level": "Bajo",
      "key": "low"
    },
    {
      "from": 12.7,
      "to": 17.7,
      "level": "Medio",
      "key": "medium"
    },
    {
      "from": 17.8,
      "to": 25,
      "level": "Alto",
      "key": "high"
    },
    {
      "from": 25.1,
      "to": 100,
      "level": "Muy alto",
      "key": "very_high"
    }
  ],
  "EST_AO": [
    {
      "from": 0,
      "to": 6.5,
      "level": "Muy bajo",
      "key": "very_low"
    },
    {
      "from": 6.6,
      "to": 11.8,
      "level": "Bajo",
      "key": "low"
    },
    {
      "from": 11.9,
      "to": 17,
      "level": "Medio",
      "key": "medium"
    },
    {
      "from": 17.1,
      "to": 23.4,
      "level": "Alto",
      "key": "high"
    },
    {
      "from": 23.5,
      "to": 100,
      "level": "Muy alto",
      "key": "very_high"
    }
  ],
  "GENERAL_A": [
    {
      "from": 0,
      "to": 18.8,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 18.9,
      "to": 24.4,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 24.5,
      "to": 29.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 29.6,
      "to": 35.4,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 35.5,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ],
  "GENERAL_B": [
    {
      "from": 0,
      "to": 19.9,
      "level": "Sin riesgo o riesgo despreciable",
      "key": "none"
    },
    {
      "from": 20,
      "to": 24.8,
      "level": "Riesgo bajo",
      "key": "low"
    },
    {
      "from": 24.9,
      "to": 29.5,
      "level": "Riesgo medio",
      "key": "medium"
    },
    {
      "from": 29.6,
      "to": 35.4,
      "level": "Riesgo alto",
      "key": "high"
    },
    {
      "from": 35.5,
      "to": 100,
      "level": "Riesgo muy alto",
      "key": "very_high"
    }
  ]
} as const satisfies Record<string, readonly V3BaremoBand[]>;

