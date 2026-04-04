const CategoryService = require("../services/categoryService");
const AuditService = require("../services/auditService");
const { AUDIT_ACTIONS } = require("../constants");
const { ok, created, fail } = require("../utils/responseFormatter");
const { parsePagination } = require("../utils/paginate");

const CategoryController = {
  async create(req, res, next) {
    try {
      const category = await CategoryService.create({
        ...req.body,
        createdBy: req.user.id,
      });

      await AuditService.log({
        action: AUDIT_ACTIONS.CATEGORY_CREATED,
        performedBy: req.user.id,
        targetType: "Category",
        targetId: category.id,
        metadata: { name: category.name, type: category.type },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return created(res, { message: "Category created", category });
    } catch (e) {
      return next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { type, isActive } = req.query;
      const result = await CategoryService.list({ type, isActive, page, limit });
      return ok(res, result);
    } catch (e) {
      return next(e);
    }
  },

  async getOne(req, res, next) {
    try {
      const category = await CategoryService.findById(req.params.id);
      if (!category) return fail(res, 404, "Category not found");
      return ok(res, { category });
    } catch (e) {
      return next(e);
    }
  },

  async update(req, res, next) {
    try {
      const category = await CategoryService.update(req.params.id, req.body);

      await AuditService.log({
        action: AUDIT_ACTIONS.CATEGORY_UPDATED,
        performedBy: req.user.id,
        targetType: "Category",
        targetId: req.params.id,
        metadata: req.body,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return ok(res, { message: "Category updated", category });
    } catch (e) {
      return next(e);
    }
  },

  async delete(req, res, next) {
    try {
      const category = await CategoryService.delete(req.params.id);

      await AuditService.log({
        action: AUDIT_ACTIONS.CATEGORY_DELETED,
        performedBy: req.user.id,
        targetType: "Category",
        targetId: req.params.id,
        metadata: { name: category.name },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return ok(res, { message: "Category deleted", category });
    } catch (e) {
      return next(e);
    }
  },
};

module.exports = CategoryController;
