import { validationResult } from 'express-validator';
import FinancialRecord from '../models/FinancialRecord.js';

export const getRecords = async (req, res) => {
  try {
    const { type, category, date_from, date_to, page = 1, limit = 10 } = req.query;

    const filter = { deletedAt: null };
    if (type)     filter.type     = type;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (date_from || date_to) {
      filter.date = {};
      if (date_from) filter.date.$gte = new Date(date_from);
      if (date_to)   filter.date.$lte = new Date(date_to);
    }

    const [records, total] = await Promise.all([
      FinancialRecord.find(filter).populate('userId', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      FinancialRecord.countDocuments(filter),
    ]);

    const data = records.map(r => ({
      id: r._id, amount: r.amount, type: r.type,
      category: r.category, date: r.date, notes: r.notes,
      createdAt: r.createdAt, created_by: r.userId?.name,
    }));

    return res.status(200).json({
      success: true, data,
      pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) },
    });
  } catch (err) {
    console.error('Get records error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getRecordById = async (req, res) => {
  try {
    const record = await FinancialRecord.findOne({ _id: req.params.id, deletedAt: null })
      .populate('userId', 'name');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

    return res.status(200).json({
      success: true,
      data: { id: record._id, amount: record.amount, type: record.type, category: record.category,
              date: record.date, notes: record.notes, createdAt: record.createdAt,
              updatedAt: record.updatedAt, created_by: record.userId?.name },
    });
  } catch (err) {
    console.error('Get record error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const createRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { amount, type, category, date, notes } = req.body;

  try {
    const record = await FinancialRecord.create({
      userId: req.user._id, amount, type, category, date: new Date(date), notes: notes ?? null,
    });

    return res.status(201).json({ success: true, message: 'Record created.', data: record });
  } catch (err) {
    console.error('Create record error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { amount, type, category, date, notes } = req.body;

  try {
    const data = {
      ...(amount   !== undefined && { amount }),
      ...(type                  && { type }),
      ...(category              && { category }),
      ...(date                  && { date: new Date(date) }),
      ...(notes    !== undefined && { notes }),
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    const record = await FinancialRecord.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null }, data, { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

    return res.status(200).json({ success: true, message: 'Record updated.', data: record });
  } catch (err) {
    console.error('Update record error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const record = await FinancialRecord.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Record not found or already deleted.' });

    return res.status(200).json({ success: true, message: 'Record deleted (soft).' });
  } catch (err) {
    console.error('Delete record error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};