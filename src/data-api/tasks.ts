import { Controller } from '@ajs/api/beta';
import { DataController, DefaultRoutes, RegisterDataController } from '@ajs/data-api/beta';
import { Authentication } from '@ajs/auth/beta';
import { Task } from '../db/tables/task.table';
import { TaskModel } from '../db/models/task.model';
import { Access, AccessMode, Listable, Mandatory, ModelReference, Sortable } from '@ajs/data-api/beta/metadata';
import { StaticModel } from '@ajs/database-decorators/beta';

/**
 * Custom route definition with authentication
 */
const AuthenticatedRoutes = {
  get: {
    ...DefaultRoutes.Get,
    args: [Authentication(), ...DefaultRoutes.Get.args],
  },
  list: {
    ...DefaultRoutes.List,
    args: [Authentication(), ...DefaultRoutes.List.args],
  },
  new: {
    ...DefaultRoutes.New,
    args: [Authentication(), ...DefaultRoutes.New.args],
  },
  edit: {
    ...DefaultRoutes.Edit,
    args: [Authentication(), ...DefaultRoutes.Edit.args],
  },
  delete: {
    ...DefaultRoutes.Delete,
    args: [Authentication(), ...DefaultRoutes.Delete.args],
  },
};

/**
 * Task Data API Controller
 * Provides CRUD operations for tasks with authentication
 */
@RegisterDataController()
export class TaskDataAPI extends DataController(Task, AuthenticatedRoutes, Controller('/tasks')) {
  @ModelReference()
  @StaticModel(TaskModel, 'default')
  declare taskModel: TaskModel;

  @Listable()
  @Sortable()
  @Access(AccessMode.ReadOnly)
  declare _id: string;

  @Listable()
  @Sortable()
  @Mandatory('new', 'edit')
  @Access(AccessMode.ReadWrite)
  declare title: string;

  @Listable()
  @Access(AccessMode.ReadWrite)
  declare description: string;

  @Listable()
  @Sortable()
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
