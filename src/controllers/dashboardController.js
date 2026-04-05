import FinancialRecord from '../models/FinancialRecord.js';

export const getSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const match = { deletedAt: null };
    if (date_from || date_to) {
      match.date = {};
      if (date_from) match.date.$gte = new Date(date_from);
      if (date_to)   match.date.$lte = new Date(date_to);
    }

    const result = await FinancialRecord.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        total_income:   { $sum: { $cond: [{ $eq: ['$type', 'income']  }, '$amount', 0] } },
        total_expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        total_records:  { $sum: 1 },
      }},
      { $addFields: { net_balance: { $subtract: ['$total_income', '$total_expenses'] } } },
    ]);

    const data = result[0] || { total_income: 0, total_expenses: 0, net_balance: 0, total_records: 0 };
    const { _id, ...summary } = data;
    return res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error('Summary error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getCategoryTotals = async (req, res) => {
  try {
    const { type, date_from, date_to } = req.query;
    const match = { deletedAt: null };
    if (type)     match.type = type;
    if (date_from || date_to) {
      match.date = {};
      if (date_from) match.date.$gte = new Date(date_from);
      if (date_to)   match.date.$lte = new Date(date_to);
    }

    const data = await FinancialRecord.aggregate([
      { $match: match },
      { $group: {
        _id:          { category: '$category', type: '$type' },
        record_count: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        avg_amount:   { $avg: '$amount' },
        min_amount:   { $min: '$amount' },
        max_amount:   { $max: '$amount' },
      }},
      { $sort: { total_amount: -1 } },
      { $project: {
        _id: 0, category: '$_id.category', type: '$_id.type',
        record_count: 1, total_amount: 1, avg_amount: 1, min_amount: 1, max_amount: 1,
      }},
    ]);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Category totals error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getMonthlyTrends = async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 12, 24);
    const since  = new Date();
    since.setMonth(since.getMonth() - months);

    const data = await FinancialRecord.aggregate([
      { $match: { deletedAt: null, date: { $gte: since } } },
      { $group: {
        _id:      { year: { $year: '$date' }, month: { $month: '$date' } },
        income:   { $sum: { $cond: [{ $eq: ['$type', 'income']  }, '$amount', 0] } },
        expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      }},
      { $addFields: { net: { $subtract: ['$income', '$expenses'] } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: {
        _id: 0,
        month: { $dateToString: { format: '%Y-%m', date: {
          $dateFromParts: { year: '$_id.year', month: '$_id.month', day: 1 }
        }}},
        income: 1, expenses: 1, net: 1,
      }},
    ]);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Monthly trends error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getWeeklyTrends = async (req, res) => {
  try {
    const weeks = Math.min(parseInt(req.query.weeks) || 8, 52);
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const data = await FinancialRecord.aggregate([
      { $match: { deletedAt: null, date: { $gte: since } } },
      { $group: {
        _id:      { week: { $week: '$date' }, year: { $year: '$date' } },
        income:   { $sum: { $cond: [{ $eq: ['$type', 'income']  }, '$amount', 0] } },
        expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      }},
      { $addFields: { net: { $subtract: ['$income', '$expenses'] } } },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $project: {
        _id: 0, week: '$_id.week', year: '$_id.year',
        income: 1, expenses: 1, net: 1,
      }},
    ]);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Weekly trends error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const records = await FinancialRecord.find({ deletedAt: null })
      .populate('userId', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    const data = records.map(r => ({
      id: r._id, amount: r.amount, type: r.type, category: r.category,
      date: r.date, notes: r.notes, createdAt: r.createdAt, created_by: r.userId?.name,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Recent activity error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};