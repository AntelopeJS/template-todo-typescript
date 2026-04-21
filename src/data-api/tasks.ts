import { Controller } from '@antelopejs/interface-api';
import { DataController, DefaultRoutes, RegisterDataController } from '@antelopejs/interface-data-api';
import { Authentication } from '@antelopejs/interface-auth';
import { Task } from '../db/tables/task.table';
import { TaskModel } from '../db/models/task.model';
import { Access, AccessMode, Listable, Mandatory, ModelReference, Sortable } from '@antelopejs/interface-data-api/metadata';
import { Model } from '@antelopejs/interface-database-decorators';

// Authentication() is appended (not prepended) so it runs as an extra parameter
// provider (enforcing 401 on missing/invalid token) without shifting the positional
// args consumed by the default DataController handlers.
const AuthenticatedRoutes = {
  get: { ...DefaultRoutes.Get, args: [...DefaultRoutes.Get.args, Authentication()] },
  list: { ...DefaultRoutes.List, args: [...DefaultRoutes.List.args, Authentication()] },
  new: { ...DefaultRoutes.New, args: [...DefaultRoutes.New.args, Authentication()] },
  edit: { ...DefaultRoutes.Edit, args: [...DefaultRoutes.Edit.args, Authentication()] },
  delete: { ...DefaultRoutes.Delete, args: [...DefaultRoutes.Delete.args, Authentication()] },
};

/**
 * Task Data API Controller
 * Provides CRUD operations for tasks with authentication
 */
@RegisterDataController()
export class TaskDataAPI extends DataController(Task, AuthenticatedRoutes, Controller('/tasks')) {
  @ModelReference()
  @Model(TaskModel, 'default')
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
