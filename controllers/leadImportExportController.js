const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');
const Lead = require('../models/Lead');
const PropertyType = require('../models/PropertyType');
const PropertyCondition = require('../models/PropertyCondition');
const Landmark = require('../models/Landmark');

const LEAD_TYPES = ['Buyer', 'Broker', 'Seller'];
const PROPERTY_TYPES = ['Residential Rent', 'Residential Sell', 'Commercial Rent', 'Commercial Sell'];
const LEAD_STATUSES = ['New', 'Attempted 1', 'Attempted 2', 'Attempted 3', 'Follow-up', 'unqualified', 'warm' ,'hot', 'site visit planned', 'site visit done', 'booked' ,'booed someware else',];

const exportLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find()
    .populate('propertyCategory', 'name')
    .populate('propertyCondition', 'name')
    .populate('landmark', 'name city area')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leads');

  worksheet.columns = [
    { header: 'Lead Type', key: 'leadType', width: 15 },
    { header: 'Full Name', key: 'fullName', width: 25 },
    { header: 'Phone Number', key: 'phoneNumber', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'Budget', key: 'budget', width: 15 },
    { header: 'Reference', key: 'ref', width: 20 },
    { header: 'Property Type', key: 'propertyType', width: 20 },
    { header: 'Configuration', key: 'propertyCategory', width: 20 },
    { header: 'Property Condition', key: 'propertyCondition', width: 20 },
    { header: 'Landmark', key: 'landmark', width: 25 },
    { header: 'Preferred Location', key: 'preferredLocation', width: 25 },
    { header: 'Lead Status', key: 'leadStatus', width: 15 },
    { header: 'Next Call Date', key: 'nextCallDate', width: 20 },
    { header: 'Purpose of Buying', key: 'purposeOfBuying', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  leads.forEach(lead => {
    worksheet.addRow({
      leadType: lead.leadType,
      fullName: lead.fullName,
      phoneNumber: lead.phoneNumber,
      email: lead.email || '',
      city: lead.city || '',
      budget: lead.budget || '',
      ref: lead.ref || '',
      propertyType: lead.propertyType || '',
      propertyCategory: lead.propertyCategory?.name || '',
      propertyCondition: lead.propertyCondition?.name || '',
      landmark: lead.landmark?.name || '',
      preferredLocation: lead.preferredLocation || '',
      leadStatus: lead.leadStatus,
      nextCallDate: lead.nextCallDate ? new Date(lead.nextCallDate).toLocaleString() : '',
      purposeOfBuying: lead.purposeOfBuying || '',
      remarks: lead.remarks || ''
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=leads-export-${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});

const downloadTemplate = asyncHandler(async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Lead Template');

  worksheet.columns = [
    { header: 'Lead Type*', key: 'leadType', width: 15 },
    { header: 'Full Name*', key: 'fullName', width: 25 },
    { header: 'Phone Number*', key: 'phoneNumber', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'Budget', key: 'budget', width: 15 },
    { header: 'Reference', key: 'ref', width: 20 },
    { header: 'Property Type', key: 'propertyType', width: 20 },
    { header: 'Configuration', key: 'propertyCategory', width: 20 },
    { header: 'Property Condition', key: 'propertyCondition', width: 20 },
    { header: 'Landmark', key: 'landmark', width: 25 },
    { header: 'Preferred Location', key: 'preferredLocation', width: 25 },
    { header: 'Lead Status', key: 'leadStatus', width: 15 },
    { header: 'Next Call Date', key: 'nextCallDate', width: 20 },
    { header: 'Purpose of Buying', key: 'purposeOfBuying', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  worksheet.addRow({
    leadType: 'Buyer',
    fullName: 'John Doe',
    phoneNumber: '9876543210',
    email: 'john@example.com',
    city: 'Mumbai',
    budget: 5000000,
    ref: 'REF001',
    propertyType: 'Residential Sell',
    propertyCategory: 'Apartment',
    propertyCondition: 'New',
    landmark: 'Marine Drive',
    preferredLocation: 'South Mumbai',
    leadStatus: 'New',
    remarks: 'Interested in 2BHK'
  });

  worksheet.addRow({
    leadType: 'Seller',
    fullName: 'Jane Smith',
    phoneNumber: '9876543211',
    email: '',
    city: 'Delhi',
    budget: 8000000,
    ref: '',
    propertyType: 'Commercial Rent',
    propertyCategory: 'Office Space',
    propertyCondition: 'Resale',
    landmark: 'Connaught Place',
    preferredLocation: 'Central Delhi',
    leadStatus: 'Contacted',
    remarks: ''
  });

  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Description', key: 'description', width: 60 },
    { header: 'Required', key: 'required', width: 12 },
    { header: 'Valid Values', key: 'values', width: 40 }
  ];

  instructionsSheet.getRow(1).font = { bold: true };
  instructionsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  instructionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  const instructions = [
    { field: 'Lead Type*', description: 'Type of lead', required: 'Yes', values: 'Buyer, Broker, Seller' },
    { field: 'Full Name*', description: 'Full name of the lead', required: 'Yes', values: 'Any text' },
    { field: 'Phone Number*', description: 'Contact phone number', required: 'Yes', values: 'Any text/number' },
    { field: 'Email', description: 'Email address', required: 'No', values: 'Valid email format' },
    { field: 'City', description: 'City name', required: 'No', values: 'Any text' },
    { field: 'Budget', description: 'Budget amount', required: 'No', values: 'Number only' },
    { field: 'Reference', description: 'Reference code', required: 'No', values: 'Any text' },
    { field: 'Property Type', description: 'Type of property', required: 'No', values: 'Residential Rent, Residential Sell, Commercial Rent, Commercial Sell' },
    { field: 'Configuration', description: 'Category (will be created if new)', required: 'No', values: 'Any text (e.g., Apartment, Villa, Office)' },
    { field: 'Property Condition', description: 'Condition (will be created if new)', required: 'No', values: 'Any text (e.g., New, Resale, Under Construction)' },
    { field: 'Landmark', description: 'Landmark name (will be created if new)', required: 'No', values: 'Any text' },
    { field: 'Preferred Location', description: 'Preferred location', required: 'No', values: 'Any text' },
    { field: 'Lead Status', description: 'Current status of lead', required: 'No', values: 'New, Contacted, Follow-up, Closed, Lost (default: New)' },
    { field: 'Remarks', description: 'Additional notes', required: 'No', values: 'Any text' }
  ];

  instructions.forEach(inst => instructionsSheet.addRow(inst));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=lead-import-template.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

const validateImport = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);
  
  const worksheet = workbook.getWorksheet('Lead Template') || workbook.getWorksheet(1);
  
  const validationResults = [];
  const newRecordsToCreate = {
    propertyCategories: new Set(),
    propertyConditions: new Set(),
    landmarks: new Set()
  };

  const existingPropertyCategories = await PropertyType.find().select('name');
  const existingPropertyConditions = await PropertyCondition.find().select('name');
  const existingLandmarks = await Landmark.find().select('name');

  const propertyCategoryMap = new Map(existingPropertyCategories.map(p => [p.name.toLowerCase(), p]));
  const propertyConditionMap = new Map(existingPropertyConditions.map(p => [p.name.toLowerCase(), p]));
  const landmarkMap = new Map(existingLandmarks.map(l => [l.name.toLowerCase(), l]));

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowData = {
      rowNumber,
      leadType: row.getCell(1).value,
      fullName: row.getCell(2).value,
      phoneNumber: row.getCell(3).value?.toString(),
      email: row.getCell(4).value,
      city: row.getCell(5).value,
      budget: row.getCell(6).value,
      ref: row.getCell(7).value,
      propertyType: row.getCell(8).value,
      propertyCategory: row.getCell(9).value,
      propertyCondition: row.getCell(10).value,
      landmark: row.getCell(11).value,
      preferredLocation: row.getCell(12).value,
      leadStatus: row.getCell(13).value || 'New',
      remarks: row.getCell(14).value
    };

    const errors = [];
    const warnings = [];

    if (!rowData.leadType) {
      errors.push('Lead Type is required');
    } else if (!LEAD_TYPES.includes(rowData.leadType)) {
      errors.push(`Invalid Lead Type. Must be one of: ${LEAD_TYPES.join(', ')}`);
    }

    if (!rowData.fullName) {
      errors.push('Full Name is required');
    }

    if (!rowData.phoneNumber) {
      errors.push('Phone Number is required');
    }

    if (rowData.propertyType && !PROPERTY_TYPES.includes(rowData.propertyType)) {
      errors.push(`Invalid Property Type. Must be one of: ${PROPERTY_TYPES.join(', ')}`);
    }

    if (rowData.leadStatus && !LEAD_STATUSES.includes(rowData.leadStatus)) {
      errors.push(`Invalid Lead Status. Must be one of: ${LEAD_STATUSES.join(', ')}`);
    }

    if (rowData.propertyCategory) {
      const categoryLower = rowData.propertyCategory.toLowerCase();
      if (!propertyCategoryMap.has(categoryLower)) {
        newRecordsToCreate.propertyCategories.add(rowData.propertyCategory);
        warnings.push(`New Property Category "${rowData.propertyCategory}" will be created`);
      }
    }

    if (rowData.propertyCondition) {
      const conditionLower = rowData.propertyCondition.toLowerCase();
      if (!propertyConditionMap.has(conditionLower)) {
        newRecordsToCreate.propertyConditions.add(rowData.propertyCondition);
        warnings.push(`New Property Condition "${rowData.propertyCondition}" will be created`);
      }
    }

    if (rowData.landmark) {
      const landmarkLower = rowData.landmark.toLowerCase();
      if (!landmarkMap.has(landmarkLower)) {
        newRecordsToCreate.landmarks.add(rowData.landmark);
        warnings.push(`New Landmark "${rowData.landmark}" will be created`);
      }
    }

    validationResults.push({
      ...rowData,
      isValid: errors.length === 0,
      errors,
      warnings
    });
  });

  res.json({
    success: true,
    data: {
      totalRows: validationResults.length,
      validRows: validationResults.filter(r => r.isValid).length,
      invalidRows: validationResults.filter(r => !r.isValid).length,
      newRecordsToCreate: {
        propertyCategories: Array.from(newRecordsToCreate.propertyCategories),
        propertyConditions: Array.from(newRecordsToCreate.propertyConditions),
        landmarks: Array.from(newRecordsToCreate.landmarks)
      },
      validationResults
    }
  });
});

const importLeads = asyncHandler(async (req, res) => {
  const { validatedRows } = req.body;

  if (!validatedRows || !Array.isArray(validatedRows) || validatedRows.length === 0) {
    res.status(400);
    throw new Error('No validated rows provided');
  }

  const adminId = req.admin._id;

  const existingPropertyCategories = await PropertyType.find().select('name');
  const existingPropertyConditions = await PropertyCondition.find().select('name');
  const existingLandmarks = await Landmark.find().select('name city area');

  const propertyCategoryMap = new Map(existingPropertyCategories.map(p => [p.name.toLowerCase(), p._id]));
  const propertyConditionMap = new Map(existingPropertyConditions.map(p => [p.name.toLowerCase(), p._id]));
  const landmarkMap = new Map(existingLandmarks.map(l => [l.name.toLowerCase(), l._id]));

  const newPropertyCategories = [];
  const newPropertyConditions = [];
  const newLandmarks = [];

  for (const row of validatedRows) {
    if (row.propertyCategory) {
      const categoryLower = row.propertyCategory.toLowerCase();
      if (!propertyCategoryMap.has(categoryLower)) {
        const newCategory = await PropertyType.create({
          name: row.propertyCategory,
          description: `Auto-created from import`
        });
        propertyCategoryMap.set(categoryLower, newCategory._id);
        newPropertyCategories.push(row.propertyCategory);
      }
    }

    if (row.propertyCondition) {
      const conditionLower = row.propertyCondition.toLowerCase();
      if (!propertyConditionMap.has(conditionLower)) {
        const newCondition = await PropertyCondition.create({
          name: row.propertyCondition,
          description: `Auto-created from import`
        });
        propertyConditionMap.set(conditionLower, newCondition._id);
        newPropertyConditions.push(row.propertyCondition);
      }
    }

    if (row.landmark) {
      const landmarkLower = row.landmark.toLowerCase();
      if (!landmarkMap.has(landmarkLower)) {
        const newLandmark = await Landmark.create({
          name: row.landmark,
          city: row.city || 'Unknown',
          area: row.preferredLocation || 'Unknown',
          description: `Auto-created from import`
        });
        landmarkMap.set(landmarkLower, newLandmark._id);
        newLandmarks.push(row.landmark);
      }
    }
  }

  const leadsToInsert = validatedRows.map(row => {
    const leadData = {
      leadType: row.leadType,
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      leadStatus: row.leadStatus || 'New',
      assignedTo: adminId
    };

    if (row.email) leadData.email = row.email;
    if (row.city) leadData.city = row.city;
    if (row.budget) leadData.budget = Number(row.budget);
    if (row.ref) leadData.ref = row.ref;
    if (row.propertyType) leadData.propertyType = row.propertyType;
    if (row.preferredLocation) leadData.preferredLocation = row.preferredLocation;
    if (row.remarks) leadData.remarks = row.remarks;

    if (row.propertyCategory) {
      leadData.propertyCategory = propertyCategoryMap.get(row.propertyCategory.toLowerCase());
    }
    if (row.propertyCondition) {
      leadData.propertyCondition = propertyConditionMap.get(row.propertyCondition.toLowerCase());
    }
    if (row.landmark) {
      leadData.landmark = landmarkMap.get(row.landmark.toLowerCase());
    }

    return leadData;
  });

  const insertedLeads = await Lead.insertMany(leadsToInsert, { ordered: false });

  res.json({
    success: true,
    data: {
      importedCount: insertedLeads.length,
      newRecordsCreated: {
        propertyCategories: newPropertyCategories,
        propertyConditions: newPropertyConditions,
        landmarks: newLandmarks
      }
    }
  });
});

module.exports = {
  exportLeads,
  downloadTemplate,
  validateImport,
  importLeads
};
