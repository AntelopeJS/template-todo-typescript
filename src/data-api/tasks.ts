import {
  Controller,
  HTTPResult,
  type RequestContext,
} from "@antelopejs/interface-api";
import {
  DataController,
  DefaultRoutes,
  GetDataControllerMeta,
  RegisterDataController,
} from "@antelopejs/interface-data-api";
import {
  type Parameters,
  Query,
  Validation,
} from "@antelopejs/interface-data-api/components";
import { Authentication } from "@antelopejs/interface-auth";
import { Task } from "../db/tables/task.table";
import { TaskModel } from "../db/models/task.model";
import type { AuthUser } from "../routes/auth";
import {
  Access,
  AccessMode,
  Filter,
  Listable,
  Mandatory,
  ModelReference,
  Sortable,
} from "@antelopejs/interface-data-api/metadata";
import { Model } from "@antelopejs/interface-database-decorators";

/** The part of {@link TaskDataAPI} that the task routes use. */
interface TaskRouteHost {
  taskModel: TaskModel;
}

/** The answer the default `get` route gives for an id that names no row. */
function notFound() {
  return new HTTPResult(404, "Not Found");
}

/**
 * Whether the task `id` exists, has an owner, and that owner is `caller`.
 * False when the row is missing, has no `userId`, or the token has no `userId`.
 */
async function isOwnTask(model: TaskModel, id: string, caller: AuthUser) {
  const task = await model.get(id);
  const owner = task?.userId;
  return owner != null && owner === caller.userId;
}

/** The ids among `ids` that name tasks belonging to `caller`. */
async function ownTaskIds(model: TaskModel, ids: string[], caller: AuthUser) {
  const owned = await Promise.all(
    ids.map((id) => isOwnTask(model, id, caller)),
  );
  return ids.filter((_id, index) => owned[index]);
}

/** Whether a parsed JSON body is an object (an array is one). */
function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/**
 * Reads a `new` or `edit` body as the default routes do: checks the
 * `@Mandatory` and `@Validator` fields, then keeps only the fields `@Access`
 * lets the client write.
 */
async function writableFields(
  host: TaskRouteHost,
  action: "new" | "edit",
  params: Parameters.NewParameters,
  body: Buffer,
) {
  const meta = GetDataControllerMeta(host);
  const data: unknown = JSON.parse(body.toString());
  if (!isObject(data)) {
    throw new HTTPResult(400, "The body must be a JSON object");
  }
  if (!params.noMandatory) {
    Validation.MandatoryFields(meta, data, action);
  }
  await Validation.ValidateTypes(meta, data);
  return Query.WriteProperties(host, meta, data, action);
}

/**
 * The task routes, each with `Authentication()` appended to its parameters and
 * scoped to the authenticated user.
 *
 * Appending, rather than prepending, keeps the positional arguments the default
 * `DataController` handlers read, while a request without a valid token gets a
 * 401. `get`, `edit` and `delete` treat another user's task as a missing one;
 * `list` always filters on the caller's `userId`; `new` sets `userId` from the
 * token; `new` and `edit` write through {@link TaskModel}, which sets the dates.
 * `get` looks the task up by its primary key, the key the ownership check reads.
 */
const OwnedTaskRoutes = {
  get: {
    ...DefaultRoutes.Get,
    args: [...DefaultRoutes.Get.args, Authentication()],
    async func(
      this: TaskRouteHost,
      ctx: RequestContext,
      params: Parameters.GetParameters,
      caller: AuthUser,
    ) {
      if (!(await isOwnTask(this.taskModel, params.id, caller))) {
        return notFound();
      }
      return DefaultRoutes.Get.func.call(this, ctx, {
        ...params,
        index: undefined,
      });
    },
  },
  list: {
    ...DefaultRoutes.List,
    args: [...DefaultRoutes.List.args, Authentication()],
    func(
      this: TaskRouteHost,
      ctx: RequestContext,
      params: Parameters.ListParameters,
      caller: AuthUser,
    ) {
      return DefaultRoutes.List.func.call(this, ctx, {
        ...params,
        filters: { ...params.filters, userId: [caller.userId, "eq"] },
      });
    },
  },
  new: {
    ...DefaultRoutes.New,
    args: [...DefaultRoutes.New.args, Authentication()],
    async func(
      this: TaskRouteHost,
      _ctx: RequestContext,
      params: Parameters.NewParameters,
      body: Buffer,
      caller: AuthUser,
    ) {
      const fields = await writableFields(this, "new", params, body);
      return this.taskModel.createTask({ ...fields, userId: caller.userId });
    },
  },
  edit: {
    ...DefaultRoutes.Edit,
    args: [...DefaultRoutes.Edit.args, Authentication()],
    async func(
      this: TaskRouteHost,
      _ctx: RequestContext,
      params: Parameters.EditParameters,
      body: Buffer,
      caller: AuthUser,
    ) {
      const fields = await writableFields(this, "edit", params, body);
      if (!(await isOwnTask(this.taskModel, params.id, caller))) {
        return notFound();
      }
      await this.taskModel.updateTask(params.id, fields);
      return undefined;
    },
  },
  delete: {
    ...DefaultRoutes.Delete,
    args: [...DefaultRoutes.Delete.args, Authentication()],
    async func(
      this: TaskRouteHost,
      ctx: RequestContext,
      params: Parameters.DeleteParameters,
      caller: AuthUser,
    ) {
      const id = await ownTaskIds(this.taskModel, params.id, caller);
      if (id.length === 0) {
        return 0;
      }
      return DefaultRoutes.Delete.func.call(this, ctx, { id });
    },
  },
};

/**
 * Task CRUD routes under `/tasks`: `get`, `list`, `new`, `edit` and `delete`,
 * each requiring a valid token and reaching only the caller's own tasks.
 */
@RegisterDataController()
export class TaskDataAPI extends DataController(
  Task,
  OwnedTaskRoutes,
  Controller("/tasks"),
) {
  @ModelReference()
  @Model(TaskModel, "default")
  declare taskModel: TaskModel;

  @Listable()
  @Sortable()
  @Access(AccessMode.ReadOnly)
  declare _id: string;

  @Listable()
  @Sortable()
  @Mandatory("new", "edit")
  @Access(AccessMode.ReadWrite)
  declare title: string;

  @Listable()
  @Access(AccessMode.ReadWrite)
  declare description: string;

  @Listable()
  @Sortable()
  @Filter()
  @Access(AccessMode.ReadOnly)
  declare userId: string;

  @Listable()
  @Sortable()
  @Access(AccessMode.ReadOnly)
  declare createdAt: Date;

  @Listable()
  @Sortable()
  @Access(AccessMode.ReadOnly)
  declare updatedAt: Date;
}
