import { describe, it, expect } from 'vitest'
import drugsData from '../data/drugs.json'

describe('Drug Mapping Data Validation', () => {
  it('should have at least 10 unique symptoms', () => {
    const uniqueSymptoms = new Set(drugsData.map(d => d.symptomId))
    expect(uniqueSymptoms.size).toBeGreaterThanOrEqual(10)
  })

  it('should have at least 30 unique drugs', () => {
    const uniqueDrugs = new Set(drugsData.map(d => d.drugId))
    expect(uniqueDrugs.size).toBeGreaterThanOrEqual(30)
  })

  it('every symptomId should map to at least one drugName', () => {
    drugsData.forEach(item => {
      expect(item.symptomId).toBeDefined()
      expect(item.symptomName).toBeDefined()
      expect(item.drugId).toBeDefined()
      expect(item.drugName).toBeDefined()
      expect(item.drugName.length).toBeGreaterThan(0)
    })
  })

  it('data structure should match the required fields', () => {
    const requiredFields = ['symptomId', 'symptomName', 'drugId', 'drugName', 'dosage', 'unit', 'frequency', 'contraindications']
    drugsData.forEach(item => {
      requiredFields.forEach(field => {
        expect(item).toHaveProperty(field)
      })
    })
  })
})
