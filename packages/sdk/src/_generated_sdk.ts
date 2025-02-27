import { DocumentNode } from "graphql/language/ast";
import * as L from "./_generated_documents";

/** The function for calling the graphql client */
export type LinearRequest = <Response, Variables extends Record<string, unknown>>(
  doc: DocumentNode,
  variables?: Variables
) => Promise<Response>;

/**
 * Base class to provide a request function
 *
 * @param request - function to call the graphql client
 */
export class Request {
  protected _request: LinearRequest;

  public constructor(request: LinearRequest) {
    this._request = request;
  }
}

/** Fetch return type wrapped in a promise */
export type LinearFetch<Response> = Promise<Response>;

/**
 * Variables required for pagination
 * Follows the Relay spec
 */
export type LinearConnectionVariables = {
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
};

/**
 * Default connection variables required for pagination
 * Defaults to 50 as per the Linear API
 */
function defaultConnection<Variables extends LinearConnectionVariables>(variables: Variables): Variables {
  return {
    ...variables,
    first: variables.first ?? (variables.after ? 50 : undefined),
    last: variables.last ?? (variables.before ? 50 : undefined),
  };
}

/**
 * Connection models containing a list of nodes and pagination information
 * Follows the Relay spec
 */
export class LinearConnection<Node> extends Request {
  public pageInfo: PageInfo;
  public nodes: Node[];

  public constructor(request: LinearRequest) {
    super(request);
    this.pageInfo = new PageInfo(request, { hasNextPage: false, hasPreviousPage: false });
    this.nodes = [];
  }
}

/**
 * The base connection class to provide pagination
 * Follows the Relay spec
 *
 * @param request - function to call the graphql client
 * @param fetch - Function to refetch the connection given different pagination variables
 * @param nodes - The list of models to initialize the connection
 * @param pageInfo - The pagination information to initialize the connection
 */
export class Connection<Node> extends LinearConnection<Node> {
  private _fetch: (variables?: LinearConnectionVariables) => LinearFetch<LinearConnection<Node> | undefined>;

  public constructor(
    request: LinearRequest,
    fetch: (variables?: LinearConnectionVariables) => LinearFetch<LinearConnection<Node> | undefined>,
    nodes: Node[],
    pageInfo: PageInfo
  ) {
    super(request);
    this._fetch = fetch;
    this.nodes = nodes;
    this.pageInfo = pageInfo;
  }

  /** Add nodes to the end of the existing nodes */
  private _appendNodes(nodes?: Node[]) {
    this.nodes = nodes ? [...(this.nodes ?? []), ...nodes] : this.nodes;
  }

  /** Add nodes to the start of the existing nodes */
  private _prependNodes(nodes?: Node[]) {
    this.nodes = nodes ? [...nodes, ...(this.nodes ?? [])] : this.nodes;
  }

  /** Update the pagination end cursor */
  private _appendPageInfo(pageInfo?: PageInfo) {
    if (this.pageInfo) {
      this.pageInfo.endCursor = pageInfo?.endCursor ?? this.pageInfo.startCursor;
      this.pageInfo.hasNextPage = pageInfo?.hasNextPage ?? this.pageInfo.hasNextPage;
    }
  }

  /** Update the pagination start cursor */
  private _prependPageInfo(pageInfo?: PageInfo) {
    if (this.pageInfo) {
      this.pageInfo.startCursor = pageInfo?.startCursor ?? this.pageInfo.startCursor;
      this.pageInfo.hasPreviousPage = pageInfo?.hasPreviousPage ?? this.pageInfo.hasPreviousPage;
    }
  }

  /** Fetch the next page of results and append to nodes */
  public async fetchNext(): Promise<this> {
    if (this.pageInfo?.hasNextPage) {
      const response = await this._fetch({
        after: this.pageInfo?.endCursor,
      });
      this._appendNodes(response?.nodes);
      this._appendPageInfo(response?.pageInfo);
    }
    return Promise.resolve(this);
  }

  /** Fetch the previous page of results and prepend to nodes */
  public async fetchPrevious(): Promise<this> {
    if (this.pageInfo?.hasPreviousPage) {
      const response = await this._fetch({
        before: this.pageInfo?.startCursor,
      });
      this._prependNodes(response?.nodes);
      this._prependPageInfo(response?.pageInfo);
    }
    return Promise.resolve(this);
  }
}

/**
 * Function to parse custom scalars into Date types
 *
 * @param value - value to parse
 */
function parseDate(value?: any): Date | undefined {
  try {
    return value ? new Date(value) : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Function to parse custom scalars into JSON objects
 *
 * @param value - value to parse
 */
function parseJson(value?: any): Record<string, unknown> | undefined {
  try {
    return value ? JSON.parse(value) : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * An API key. Grants access to the user's resources.
 *
 * @param request - function to call the graphql client
 * @param data - L.ApiKeyFragment response data
 */
export class ApiKey extends Request {
  public constructor(request: LinearRequest, data: L.ApiKeyFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.label = data.label;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The label of the API key. */
  public label: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
}
/**
 * ApiKeyConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this ApiKeyConnection model
 * @param data - ApiKeyConnection response data
 */
export class ApiKeyConnection extends Connection<ApiKey> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<ApiKey> | undefined>,
    data: L.ApiKeyConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new ApiKey(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * ApiKeyPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ApiKeyPayloadFragment response data
 */
export class ApiKeyPayload extends Request {
  public constructor(request: LinearRequest, data: L.ApiKeyPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.apiKey = new ApiKey(request, data.apiKey);
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The API key that was created. */
  public apiKey: ApiKey;
}
/**
 * Public information of the OAuth application.
 *
 * @param request - function to call the graphql client
 * @param data - L.ApplicationFragment response data
 */
export class Application extends Request {
  public constructor(request: LinearRequest, data: L.ApplicationFragment) {
    super(request);
    this.clientId = data.clientId;
    this.description = data.description ?? undefined;
    this.developer = data.developer;
    this.developerUrl = data.developerUrl;
    this.imageUrl = data.imageUrl ?? undefined;
    this.name = data.name;
  }

  /** OAuth application's client ID. */
  public clientId: string;
  /** Information about the application. */
  public description?: string;
  /** Name of the developer. */
  public developer: string;
  /** Url of the developer (homepage or docs). */
  public developerUrl: string;
  /** Image of the application. */
  public imageUrl?: string;
  /** Application name. */
  public name: string;
}
/**
 * ArchivePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ArchivePayloadFragment response data
 */
export class ArchivePayload extends Request {
  public constructor(request: LinearRequest, data: L.ArchivePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * Contains requested archived model objects.
 *
 * @param request - function to call the graphql client
 * @param data - L.ArchiveResponseFragment response data
 */
export class ArchiveResponse extends Request {
  public constructor(request: LinearRequest, data: L.ArchiveResponseFragment) {
    super(request);
    this.archive = data.archive;
    this.databaseVersion = data.databaseVersion;
    this.totalCount = data.totalCount;
  }

  /** A JSON serialized collection of model objects loaded from the archive */
  public archive: string;
  /** The version of the remote database. Incremented by 1 for each migration run on the database. */
  public databaseVersion: number;
  /** The total number of entities in the archive. */
  public totalCount: number;
}
/**
 * [Alpha] Issue attachment (e.g. support ticket, pull request).
 *
 * @param request - function to call the graphql client
 * @param data - L.AttachmentFragment response data
 */
export class Attachment extends Request {
  private _creator?: L.AttachmentFragment["creator"];
  private _issue: L.AttachmentFragment["issue"];

  public constructor(request: LinearRequest, data: L.AttachmentFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.groupBySource = data.groupBySource;
    this.id = data.id;
    this.metadata = parseJson(data.metadata) ?? {};
    this.source = parseJson(data.source) ?? undefined;
    this.sourceType = parseJson(data.sourceType) ?? undefined;
    this.subtitle = data.subtitle ?? undefined;
    this.title = data.title;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url;
    this._creator = data.creator ?? undefined;
    this._issue = data.issue;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Indicates if attachments for the same source application should be grouped in the Linear UI. */
  public groupBySource: boolean;
  /** The unique identifier of the entity. */
  public id: string;
  /** Custom metadata related to the attachment. */
  public metadata: Record<string, unknown>;
  /** Information about the source which created the attachment. */
  public source?: Record<string, unknown>;
  /** An accessor helper to source.type, defines the source type of the attachment. */
  public sourceType?: Record<string, unknown>;
  /** Content for the subtitle line in the Linear attachment widget. */
  public subtitle?: string;
  /** Content for the title line in the Linear attachment widget. */
  public title: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Location of the attachment which is also used as an identifier. */
  public url: string;
  /** The creator of the attachment. */
  public get creator(): LinearFetch<User> | undefined {
    return this._creator?.id ? new UserQuery(this._request).fetch(this._creator?.id) : undefined;
  }
  /** The issue this attachment belongs to. */
  public get issue(): LinearFetch<Issue> | undefined {
    return new IssueQuery(this._request).fetch(this._issue.id);
  }

  /** [DEPRECATED] Archives an issue attachment. */
  public archive() {
    return new AttachmentArchiveMutation(this._request).fetch(this.id);
  }
  /** [Alpha] Deletes an issue attachment. */
  public delete() {
    return new AttachmentDeleteMutation(this._request).fetch(this.id);
  }
  /** [Alpha] Updates an existing issue attachment. */
  public update(input: L.AttachmentUpdateInput) {
    return new AttachmentUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * AttachmentConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this AttachmentConnection model
 * @param data - AttachmentConnection response data
 */
export class AttachmentConnection extends Connection<Attachment> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Attachment> | undefined>,
    data: L.AttachmentConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Attachment(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * AttachmentPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.AttachmentPayloadFragment response data
 */
export class AttachmentPayload extends Request {
  private _attachment: L.AttachmentPayloadFragment["attachment"];

  public constructor(request: LinearRequest, data: L.AttachmentPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._attachment = data.attachment;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The issue attachment that was created. */
  public get attachment(): LinearFetch<Attachment> | undefined {
    return new AttachmentQuery(this._request).fetch(this._attachment.id);
  }
}
/**
 * Workspace audit log entry object.
 *
 * @param request - function to call the graphql client
 * @param data - L.AuditEntryFragment response data
 */
export class AuditEntry extends Request {
  private _actor?: L.AuditEntryFragment["actor"];

  public constructor(request: LinearRequest, data: L.AuditEntryFragment) {
    super(request);
    this.actorId = data.actorId ?? undefined;
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.countryCode = data.countryCode ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.ip = data.ip ?? undefined;
    this.metadata = parseJson(data.metadata) ?? undefined;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._actor = data.actor ?? undefined;
  }

  /** The ID of the user that caused the audit entry to be created. */
  public actorId?: string;
  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** Country code of request resulting to audit entry. */
  public countryCode?: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** IP from actor when entry was recorded. */
  public ip?: string;
  /** Additional metadata related to the audit entry. */
  public metadata?: Record<string, unknown>;
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user that caused the audit entry to be created. */
  public get actor(): LinearFetch<User> | undefined {
    return this._actor?.id ? new UserQuery(this._request).fetch(this._actor?.id) : undefined;
  }
}
/**
 * AuditEntryConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this AuditEntryConnection model
 * @param data - AuditEntryConnection response data
 */
export class AuditEntryConnection extends Connection<AuditEntry> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<AuditEntry> | undefined>,
    data: L.AuditEntryConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new AuditEntry(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * AuditEntryType model
 *
 * @param request - function to call the graphql client
 * @param data - L.AuditEntryTypeFragment response data
 */
export class AuditEntryType extends Request {
  public constructor(request: LinearRequest, data: L.AuditEntryTypeFragment) {
    super(request);
    this.description = data.description;
    this.type = data.type;
  }

  /** Description of the audit entry type. */
  public description: string;
  /** The audit entry type. */
  public type: string;
}
/**
 * AuthResolverResponse model
 *
 * @param request - function to call the graphql client
 * @param data - L.AuthResolverResponseFragment response data
 */
export class AuthResolverResponse extends Request {
  public constructor(request: LinearRequest, data: L.AuthResolverResponseFragment) {
    super(request);
    this.allowDomainAccess = data.allowDomainAccess ?? undefined;
    this.email = data.email ?? undefined;
    this.id = data.id;
    this.lastUsedOrganizationId = data.lastUsedOrganizationId ?? undefined;
    this.token = data.token ?? undefined;
    this.availableOrganizations = data.availableOrganizations
      ? data.availableOrganizations.map(node => new Organization(request, node))
      : undefined;
    this.users = data.users.map(node => new User(request, node));
  }

  /** Should the signup flow allow access for the domain. */
  public allowDomainAccess?: boolean;
  /** Email for the authenticated account. */
  public email?: string;
  /** User account ID. */
  public id: string;
  /** ID of the organization last accessed by the user. */
  public lastUsedOrganizationId?: string;
  /** JWT token for authentication of the account. */
  public token?: string;
  /** Organizations this account has access to, but is not yet a member. */
  public availableOrganizations?: Organization[];
  /** Users belonging to this account. */
  public users: User[];
}
/**
 * Public information of the OAuth application, plus the authorized scopes for a given user.
 *
 * @param request - function to call the graphql client
 * @param data - L.AuthorizedApplicationFragment response data
 */
export class AuthorizedApplication extends Request {
  public constructor(request: LinearRequest, data: L.AuthorizedApplicationFragment) {
    super(request);
    this.appId = data.appId;
    this.clientId = data.clientId;
    this.description = data.description ?? undefined;
    this.developer = data.developer;
    this.developerUrl = data.developerUrl;
    this.imageUrl = data.imageUrl ?? undefined;
    this.name = data.name;
    this.scope = data.scope;
    this.webhooksEnabled = data.webhooksEnabled;
  }

  /** OAuth application's ID. */
  public appId: string;
  /** OAuth application's client ID. */
  public clientId: string;
  /** Information about the application. */
  public description?: string;
  /** Name of the developer. */
  public developer: string;
  /** Url of the developer (homepage or docs). */
  public developerUrl: string;
  /** Image of the application. */
  public imageUrl?: string;
  /** Application name. */
  public name: string;
  /** Scopes that are authorized for this application for a given user. */
  public scope: string[];
  /** Whether or not webhooks are enabled for the application. */
  public webhooksEnabled: boolean;
}
/**
 * BillingDetailsPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.BillingDetailsPayloadFragment response data
 */
export class BillingDetailsPayload extends Request {
  public constructor(request: LinearRequest, data: L.BillingDetailsPayloadFragment) {
    super(request);
    this.email = data.email ?? undefined;
    this.success = data.success;
    this.paymentMethod = data.paymentMethod ? new Card(request, data.paymentMethod) : undefined;
    this.invoices = data.invoices.map(node => new Invoice(request, node));
  }

  /** The customer's email address the invoices are sent to. */
  public email?: string;
  /** Whether the operation was successful. */
  public success: boolean;
  /** List of invoices, if any. */
  public invoices: Invoice[];
  /** The payment method. */
  public paymentMethod?: Card;
}
/**
 * BillingEmailPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.BillingEmailPayloadFragment response data
 */
export class BillingEmailPayload extends Request {
  public constructor(request: LinearRequest, data: L.BillingEmailPayloadFragment) {
    super(request);
    this.email = data.email ?? undefined;
    this.success = data.success;
  }

  /** The customer's email address the invoices are sent to. */
  public email?: string;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * Card model
 *
 * @param request - function to call the graphql client
 * @param data - L.CardFragment response data
 */
export class Card extends Request {
  public constructor(request: LinearRequest, data: L.CardFragment) {
    super(request);
    this.brand = data.brand;
    this.last4 = data.last4;
  }

  /** The brand of the card, e.g. Visa. */
  public brand: string;
  /** The last four digits used to identify the card. */
  public last4: string;
}
/**
 * CollaborationDocumentUpdatePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.CollaborationDocumentUpdatePayloadFragment response data
 */
export class CollaborationDocumentUpdatePayload extends Request {
  public constructor(request: LinearRequest, data: L.CollaborationDocumentUpdatePayloadFragment) {
    super(request);
    this.success = data.success;
    this.steps = data.steps ? new StepsResponse(request, data.steps) : undefined;
  }

  /** Whether the operation was successful. */
  public success: boolean;
  /** Document steps the client has not seen yet and need to rebase it's local steps on. */
  public steps?: StepsResponse;
}
/**
 * A comment associated with an issue.
 *
 * @param request - function to call the graphql client
 * @param data - L.CommentFragment response data
 */
export class Comment extends Request {
  private _issue: L.CommentFragment["issue"];
  private _user: L.CommentFragment["user"];

  public constructor(request: LinearRequest, data: L.CommentFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.body = data.body;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.editedAt = parseDate(data.editedAt) ?? undefined;
    this.id = data.id;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url;
    this._issue = data.issue;
    this._user = data.user;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The comment content in markdown format. */
  public body: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The time user edited the comment. */
  public editedAt?: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Comment's URL. */
  public url: string;
  /** The issue that the comment is associated with. */
  public get issue(): LinearFetch<Issue> | undefined {
    return new IssueQuery(this._request).fetch(this._issue.id);
  }
  /** The user who wrote the comment. */
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }

  /** Deletes a comment. */
  public delete() {
    return new CommentDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates a comment. */
  public update(input: L.CommentUpdateInput) {
    return new CommentUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * CommentConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this CommentConnection model
 * @param data - CommentConnection response data
 */
export class CommentConnection extends Connection<Comment> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Comment> | undefined>,
    data: L.CommentConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Comment(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * CommentPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.CommentPayloadFragment response data
 */
export class CommentPayload extends Request {
  private _comment: L.CommentPayloadFragment["comment"];

  public constructor(request: LinearRequest, data: L.CommentPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._comment = data.comment;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The comment that was created or updated. */
  public get comment(): LinearFetch<Comment> | undefined {
    return new CommentQuery(this._request).fetch(this._comment.id);
  }
}
/**
 * GitHub's commit data
 *
 * @param request - function to call the graphql client
 * @param data - L.CommitPayloadFragment response data
 */
export class CommitPayload extends Request {
  public constructor(request: LinearRequest, data: L.CommitPayloadFragment) {
    super(request);
    this.added = data.added;
    this.id = data.id;
    this.message = data.message;
    this.modified = data.modified;
    this.removed = data.removed;
    this.timestamp = data.timestamp;
    this.url = data.url;
  }

  public added: string[];
  public id: string;
  public message: string;
  public modified: string[];
  public removed: string[];
  public timestamp: string;
  public url: string;
}
/**
 * ContactPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ContactPayloadFragment response data
 */
export class ContactPayload extends Request {
  public constructor(request: LinearRequest, data: L.ContactPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * CreateCsvExportReportPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.CreateCsvExportReportPayloadFragment response data
 */
export class CreateCsvExportReportPayload extends Request {
  public constructor(request: LinearRequest, data: L.CreateCsvExportReportPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * CreateOrJoinOrganizationResponse model
 *
 * @param request - function to call the graphql client
 * @param data - L.CreateOrJoinOrganizationResponseFragment response data
 */
export class CreateOrJoinOrganizationResponse extends Request {
  private _user: L.CreateOrJoinOrganizationResponseFragment["user"];

  public constructor(request: LinearRequest, data: L.CreateOrJoinOrganizationResponseFragment) {
    super(request);
    this._user = data.user;
  }

  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }
}
/**
 * A custom view that has been saved by a user.
 *
 * @param request - function to call the graphql client
 * @param data - L.CustomViewFragment response data
 */
export class CustomView extends Request {
  private _creator: L.CustomViewFragment["creator"];
  private _team?: L.CustomViewFragment["team"];

  public constructor(request: LinearRequest, data: L.CustomViewFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.color = data.color ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.description = data.description ?? undefined;
    this.filterData = parseJson(data.filterData) ?? {};
    this.filters = parseJson(data.filters) ?? {};
    this.icon = data.icon ?? undefined;
    this.id = data.id;
    this.name = data.name;
    this.shared = data.shared;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._creator = data.creator;
    this._team = data.team ?? undefined;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The color of the icon of the custom view. */
  public color?: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The description of the custom view. */
  public description?: string;
  /** [Alpha] The filter applied to issues in the custom view. */
  public filterData: Record<string, unknown>;
  /** The filters applied to issues in the custom view. */
  public filters: Record<string, unknown>;
  /** The icon of the custom view. */
  public icon?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The name of the custom view. */
  public name: string;
  /** Whether the custom view is shared with everyone in the organization. */
  public shared: boolean;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user who created the custom view. */
  public get creator(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._creator.id);
  }
  /** The organization of the custom view. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  /** The team associated with the custom view. */
  public get team(): LinearFetch<Team> | undefined {
    return this._team?.id ? new TeamQuery(this._request).fetch(this._team?.id) : undefined;
  }

  /** Deletes a custom view. */
  public delete() {
    return new CustomViewDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates a custom view. */
  public update(input: L.CustomViewUpdateInput) {
    return new CustomViewUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * CustomViewConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this CustomViewConnection model
 * @param data - CustomViewConnection response data
 */
export class CustomViewConnection extends Connection<CustomView> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<CustomView> | undefined>,
    data: L.CustomViewConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new CustomView(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * CustomViewPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.CustomViewPayloadFragment response data
 */
export class CustomViewPayload extends Request {
  private _customView: L.CustomViewPayloadFragment["customView"];

  public constructor(request: LinearRequest, data: L.CustomViewPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._customView = data.customView;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The custom view that was created or updated. */
  public get customView(): LinearFetch<CustomView> | undefined {
    return new CustomViewQuery(this._request).fetch(this._customView.id);
  }
}
/**
 * A set of issues to be resolved in a specified amount of time.
 *
 * @param request - function to call the graphql client
 * @param data - L.CycleFragment response data
 */
export class Cycle extends Request {
  private _team: L.CycleFragment["team"];

  public constructor(request: LinearRequest, data: L.CycleFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.autoArchivedAt = parseDate(data.autoArchivedAt) ?? undefined;
    this.completedAt = parseDate(data.completedAt) ?? undefined;
    this.completedIssueCountHistory = data.completedIssueCountHistory;
    this.completedScopeHistory = data.completedScopeHistory;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.endsAt = parseDate(data.endsAt) ?? new Date();
    this.id = data.id;
    this.issueCountHistory = data.issueCountHistory;
    this.name = data.name ?? undefined;
    this.number = data.number;
    this.progress = data.progress;
    this.scopeHistory = data.scopeHistory;
    this.startsAt = parseDate(data.startsAt) ?? new Date();
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._team = data.team;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the cycle was automatically archived by the auto pruning process. */
  public autoArchivedAt?: Date;
  /** The completion time of the cycle. If null, the cycle hasn't been completed. */
  public completedAt?: Date;
  /** The number of completed issues in the cycle after each day. */
  public completedIssueCountHistory: number[];
  /** The number of completed estimation points after each day. */
  public completedScopeHistory: number[];
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The end time of the cycle. */
  public endsAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The total number of issues in the cycle after each day. */
  public issueCountHistory: number[];
  /** The custom name of the cycle. */
  public name?: string;
  /** The number of the cycle. */
  public number: number;
  /** The overall progress of the cycle. This is the (completed estimate points + 0.25 * in progress estimate points) / total estimate points. */
  public progress: number;
  /** The total number of estimation points after each day. */
  public scopeHistory: number[];
  /** The start time of the cycle. */
  public startsAt: Date;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The team that the cycle is associated with. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }
  /** Issues associated with the cycle. */
  public issues(variables?: Omit<L.Cycle_IssuesQueryVariables, "id">) {
    return new Cycle_IssuesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Issues that weren't completed when the cycle was closed. */
  public uncompletedIssuesUponClose(variables?: Omit<L.Cycle_UncompletedIssuesUponCloseQueryVariables, "id">) {
    return new Cycle_UncompletedIssuesUponCloseQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Archives a cycle. */
  public archive() {
    return new CycleArchiveMutation(this._request).fetch(this.id);
  }
  /** Updates a cycle. */
  public update(input: L.CycleUpdateInput) {
    return new CycleUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * CycleConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this CycleConnection model
 * @param data - CycleConnection response data
 */
export class CycleConnection extends Connection<Cycle> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Cycle> | undefined>,
    data: L.CycleConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Cycle(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * CyclePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.CyclePayloadFragment response data
 */
export class CyclePayload extends Request {
  private _cycle?: L.CyclePayloadFragment["cycle"];

  public constructor(request: LinearRequest, data: L.CyclePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._cycle = data.cycle ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The Cycle that was created or updated. */
  public get cycle(): LinearFetch<Cycle> | undefined {
    return this._cycle?.id ? new CycleQuery(this._request).fetch(this._cycle?.id) : undefined;
  }
}
/**
 * DebugPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.DebugPayloadFragment response data
 */
export class DebugPayload extends Request {
  public constructor(request: LinearRequest, data: L.DebugPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * Contains the requested dependencies.
 *
 * @param request - function to call the graphql client
 * @param data - L.DependencyResponseFragment response data
 */
export class DependencyResponse extends Request {
  public constructor(request: LinearRequest, data: L.DependencyResponseFragment) {
    super(request);
    this.dependencies = data.dependencies;
  }

  /** A JSON serialized collection of dependencies. */
  public dependencies: string;
}
/**
 * A document for a project.
 *
 * @param request - function to call the graphql client
 * @param data - L.DocumentFragment response data
 */
export class Document extends Request {
  private _creator: L.DocumentFragment["creator"];
  private _project: L.DocumentFragment["project"];
  private _updatedBy: L.DocumentFragment["updatedBy"];

  public constructor(request: LinearRequest, data: L.DocumentFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.color = data.color ?? undefined;
    this.content = data.content ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.icon = data.icon ?? undefined;
    this.id = data.id;
    this.slugId = data.slugId;
    this.title = data.title;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._creator = data.creator;
    this._project = data.project;
    this._updatedBy = data.updatedBy;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The color of the icon. */
  public color?: string;
  /** The document content in markdown format. */
  public content?: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The icon of the document. */
  public icon?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The document's unique URL slug. */
  public slugId: string;
  /** The document title. */
  public title: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user who created the document. */
  public get creator(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._creator.id);
  }
  /** The project that the document is associated with. */
  public get project(): LinearFetch<Project> | undefined {
    return new ProjectQuery(this._request).fetch(this._project.id);
  }
  /** The user who last updated the document. */
  public get updatedBy(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._updatedBy.id);
  }

  /** Deletes a document. */
  public delete() {
    return new DocumentDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates a document. */
  public update(input: L.DocumentUpdateInput) {
    return new DocumentUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * DocumentConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this DocumentConnection model
 * @param data - DocumentConnection response data
 */
export class DocumentConnection extends Connection<Document> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Document> | undefined>,
    data: L.DocumentConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Document(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * DocumentPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.DocumentPayloadFragment response data
 */
export class DocumentPayload extends Request {
  private _document: L.DocumentPayloadFragment["document"];

  public constructor(request: LinearRequest, data: L.DocumentPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._document = data.document;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The document that was created or updated. */
  public get document(): LinearFetch<Document> | undefined {
    return new DocumentQuery(this._request).fetch(this._document.id);
  }
}
/**
 * Collaborative editing steps for documents.
 *
 * @param request - function to call the graphql client
 * @param data - L.DocumentStepFragment response data
 */
export class DocumentStep extends Request {
  public constructor(request: LinearRequest, data: L.DocumentStepFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.clientId = data.clientId;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.step = parseJson(data.step) ?? {};
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.version = data.version;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** Connected client ID. */
  public clientId: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** Step data. */
  public step: Record<string, unknown>;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Step version. */
  public version: number;
}
/**
 * A version of a document.
 *
 * @param request - function to call the graphql client
 * @param data - L.DocumentVersionFragment response data
 */
export class DocumentVersion extends Request {
  private _creator: L.DocumentVersionFragment["creator"];
  private _project: L.DocumentVersionFragment["project"];

  public constructor(request: LinearRequest, data: L.DocumentVersionFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.content = data.content ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.revision = data.revision;
    this.title = data.title;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._creator = data.creator;
    this._project = data.project;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The document's content in markdown format. */
  public content?: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The version revision number. */
  public revision: number;
  /** The document's title. */
  public title: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user who created the version. */
  public get creator(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._creator.id);
  }
  /** The project that the document is associated with. */
  public get project(): LinearFetch<Project> | undefined {
    return new ProjectQuery(this._request).fetch(this._project.id);
  }
}
/**
 * DocumentVersionConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this DocumentVersionConnection model
 * @param data - DocumentVersionConnection response data
 */
export class DocumentVersionConnection extends Connection<DocumentVersion> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<DocumentVersion> | undefined>,
    data: L.DocumentVersionConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new DocumentVersion(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * DocumentationSearchPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.DocumentationSearchPayloadFragment response data
 */
export class DocumentationSearchPayload extends Request {
  public constructor(request: LinearRequest, data: L.DocumentationSearchPayloadFragment) {
    super(request);
    this.content = data.content;
    this.publishedAt = parseDate(data.publishedAt) ?? new Date();
    this.title = data.title;
    this.type = data.type ?? undefined;
    this.url = data.url;
  }

  /** The content of the documentation. */
  public content: string;
  /** The time the documentation was published. */
  public publishedAt: Date;
  /** The title of the found documentation. */
  public title: string;
  /** The type of documentation that was found. */
  public type?: string;
  /** The url to the documentation. */
  public url: string;
}
/**
 * EmailSubscribePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.EmailSubscribePayloadFragment response data
 */
export class EmailSubscribePayload extends Request {
  public constructor(request: LinearRequest, data: L.EmailSubscribePayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * EmailUnsubscribePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.EmailUnsubscribePayloadFragment response data
 */
export class EmailUnsubscribePayload extends Request {
  public constructor(request: LinearRequest, data: L.EmailUnsubscribePayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * EmailUserAccountAuthChallengeResponse model
 *
 * @param request - function to call the graphql client
 * @param data - L.EmailUserAccountAuthChallengeResponseFragment response data
 */
export class EmailUserAccountAuthChallengeResponse extends Request {
  public constructor(request: LinearRequest, data: L.EmailUserAccountAuthChallengeResponseFragment) {
    super(request);
    this.authType = data.authType;
    this.success = data.success;
  }

  /** Supported challenge for this user account. Can be either verificationCode or password. */
  public authType: string;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * A custom emoji.
 *
 * @param request - function to call the graphql client
 * @param data - L.EmojiFragment response data
 */
export class Emoji extends Request {
  private _creator: L.EmojiFragment["creator"];

  public constructor(request: LinearRequest, data: L.EmojiFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.name = data.name;
    this.source = data.source;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url;
    this._creator = data.creator;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The emoji's name. */
  public name: string;
  /** The source of the emoji. */
  public source: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The emoji image URL. */
  public url: string;
  /** The user who created the emoji. */
  public get creator(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._creator.id);
  }
  /** The organization that the emoji belongs to. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }

  /** Deletes an emoji. */
  public delete() {
    return new EmojiDeleteMutation(this._request).fetch(this.id);
  }
}
/**
 * EmojiConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this EmojiConnection model
 * @param data - EmojiConnection response data
 */
export class EmojiConnection extends Connection<Emoji> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Emoji> | undefined>,
    data: L.EmojiConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Emoji(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * EmojiPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.EmojiPayloadFragment response data
 */
export class EmojiPayload extends Request {
  private _emoji: L.EmojiPayloadFragment["emoji"];

  public constructor(request: LinearRequest, data: L.EmojiPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._emoji = data.emoji;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The emoji that was created. */
  public get emoji(): LinearFetch<Emoji> | undefined {
    return new EmojiQuery(this._request).fetch(this._emoji.id);
  }
}
/**
 * EventPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.EventPayloadFragment response data
 */
export class EventPayload extends Request {
  public constructor(request: LinearRequest, data: L.EventPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * User favorites presented in the sidebar.
 *
 * @param request - function to call the graphql client
 * @param data - L.FavoriteFragment response data
 */
export class Favorite extends Request {
  private _customView?: L.FavoriteFragment["customView"];
  private _cycle?: L.FavoriteFragment["cycle"];
  private _document?: L.FavoriteFragment["document"];
  private _issue?: L.FavoriteFragment["issue"];
  private _label?: L.FavoriteFragment["label"];
  private _parent?: L.FavoriteFragment["parent"];
  private _project?: L.FavoriteFragment["project"];
  private _projectTeam?: L.FavoriteFragment["projectTeam"];
  private _user: L.FavoriteFragment["user"];

  public constructor(request: LinearRequest, data: L.FavoriteFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.folderName = data.folderName ?? undefined;
    this.id = data.id;
    this.sortOrder = data.sortOrder;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._customView = data.customView ?? undefined;
    this._cycle = data.cycle ?? undefined;
    this._document = data.document ?? undefined;
    this._issue = data.issue ?? undefined;
    this._label = data.label ?? undefined;
    this._parent = data.parent ?? undefined;
    this._project = data.project ?? undefined;
    this._projectTeam = data.projectTeam ?? undefined;
    this._user = data.user;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The name of the folder. Only applies to favorites of type folder. */
  public folderName?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The order of the item in the favorites list. */
  public sortOrder: number;
  /** The type of the favorite. */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The favorited custom view. */
  public get customView(): LinearFetch<CustomView> | undefined {
    return this._customView?.id ? new CustomViewQuery(this._request).fetch(this._customView?.id) : undefined;
  }
  /** The favorited cycle. */
  public get cycle(): LinearFetch<Cycle> | undefined {
    return this._cycle?.id ? new CycleQuery(this._request).fetch(this._cycle?.id) : undefined;
  }
  /** The favorited document. */
  public get document(): LinearFetch<Document> | undefined {
    return this._document?.id ? new DocumentQuery(this._request).fetch(this._document?.id) : undefined;
  }
  /** The favorited issue. */
  public get issue(): LinearFetch<Issue> | undefined {
    return this._issue?.id ? new IssueQuery(this._request).fetch(this._issue?.id) : undefined;
  }
  /** The favorited label. */
  public get label(): LinearFetch<IssueLabel> | undefined {
    return this._label?.id ? new IssueLabelQuery(this._request).fetch(this._label?.id) : undefined;
  }
  /** The parent folder of the favorite. */
  public get parent(): LinearFetch<Favorite> | undefined {
    return this._parent?.id ? new FavoriteQuery(this._request).fetch(this._parent?.id) : undefined;
  }
  /** The favorited project. */
  public get project(): LinearFetch<Project> | undefined {
    return this._project?.id ? new ProjectQuery(this._request).fetch(this._project?.id) : undefined;
  }
  /** The favorited team of the project. */
  public get projectTeam(): LinearFetch<Team> | undefined {
    return this._projectTeam?.id ? new TeamQuery(this._request).fetch(this._projectTeam?.id) : undefined;
  }
  /** The owner of the favorite. */
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }
  /** Children of the favorite. Only applies to favorites of type folder. */
  public children(variables?: Omit<L.Favorite_ChildrenQueryVariables, "id">) {
    return new Favorite_ChildrenQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Deletes a favorite reference. */
  public delete() {
    return new FavoriteDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates a favorite. */
  public update(input: L.FavoriteUpdateInput) {
    return new FavoriteUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * FavoriteConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this FavoriteConnection model
 * @param data - FavoriteConnection response data
 */
export class FavoriteConnection extends Connection<Favorite> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Favorite> | undefined>,
    data: L.FavoriteConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Favorite(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * FavoritePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.FavoritePayloadFragment response data
 */
export class FavoritePayload extends Request {
  private _favorite: L.FavoritePayloadFragment["favorite"];

  public constructor(request: LinearRequest, data: L.FavoritePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._favorite = data.favorite;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The object that was added as a favorite. */
  public get favorite(): LinearFetch<Favorite> | undefined {
    return new FavoriteQuery(this._request).fetch(this._favorite.id);
  }
}
/**
 * FeedbackPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.FeedbackPayloadFragment response data
 */
export class FeedbackPayload extends Request {
  public constructor(request: LinearRequest, data: L.FeedbackPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * Object representing Figma preview information.
 *
 * @param request - function to call the graphql client
 * @param data - L.FigmaEmbedFragment response data
 */
export class FigmaEmbed extends Request {
  public constructor(request: LinearRequest, data: L.FigmaEmbedFragment) {
    super(request);
    this.lastModified = parseDate(data.lastModified) ?? new Date();
    this.name = data.name;
    this.nodeName = data.nodeName ?? undefined;
    this.url = data.url ?? undefined;
  }

  /** Date when the file was updated at the time of embedding. */
  public lastModified: Date;
  /** Figma file name. */
  public name: string;
  /** Node name. */
  public nodeName?: string;
  /** Figma screenshot URL. */
  public url?: string;
}
/**
 * FigmaEmbedPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.FigmaEmbedPayloadFragment response data
 */
export class FigmaEmbedPayload extends Request {
  public constructor(request: LinearRequest, data: L.FigmaEmbedPayloadFragment) {
    super(request);
    this.success = data.success;
    this.figmaEmbed = data.figmaEmbed ? new FigmaEmbed(request, data.figmaEmbed) : undefined;
  }

  /** Whether the operation was successful. */
  public success: boolean;
  /** Figma embed information. */
  public figmaEmbed?: FigmaEmbed;
}
/**
 * FrontAttachmentPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.FrontAttachmentPayloadFragment response data
 */
export class FrontAttachmentPayload extends Request {
  public constructor(request: LinearRequest, data: L.FrontAttachmentPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * GitHub OAuth token, plus information about the organizations the user is a member of.
 *
 * @param request - function to call the graphql client
 * @param data - L.GithubOAuthTokenPayloadFragment response data
 */
export class GithubOAuthTokenPayload extends Request {
  public constructor(request: LinearRequest, data: L.GithubOAuthTokenPayloadFragment) {
    super(request);
    this.token = data.token ?? undefined;
    this.organizations = data.organizations ? data.organizations.map(node => new GithubOrg(request, node)) : undefined;
  }

  /** The OAuth token if the operation to fetch it was successful. */
  public token?: string;
  /** A list of the GitHub organizations the user is a member of with attached repositories. */
  public organizations?: GithubOrg[];
}
/**
 * Relevant information for the GitHub organization.
 *
 * @param request - function to call the graphql client
 * @param data - L.GithubOrgFragment response data
 */
export class GithubOrg extends Request {
  public constructor(request: LinearRequest, data: L.GithubOrgFragment) {
    super(request);
    this.id = data.id;
    this.login = data.login;
    this.name = data.name;
    this.repositories = data.repositories.map(node => new GithubRepo(request, node));
  }

  /** GitHub organization id. */
  public id: string;
  /** The login for the GitHub organization. */
  public login: string;
  /** The name of the GitHub organization. */
  public name: string;
  /** Repositories that the organization owns. */
  public repositories: GithubRepo[];
}
/**
 * Relevant information for the GitHub repository.
 *
 * @param request - function to call the graphql client
 * @param data - L.GithubRepoFragment response data
 */
export class GithubRepo extends Request {
  public constructor(request: LinearRequest, data: L.GithubRepoFragment) {
    super(request);
    this.id = data.id;
    this.name = data.name;
  }

  /** The id of the GitHub repository. */
  public id: string;
  /** The name of the GitHub repository. */
  public name: string;
}
/**
 * Google Sheets specific settings.
 *
 * @param request - function to call the graphql client
 * @param data - L.GoogleSheetsSettingsFragment response data
 */
export class GoogleSheetsSettings extends Request {
  public constructor(request: LinearRequest, data: L.GoogleSheetsSettingsFragment) {
    super(request);
    this.sheetId = data.sheetId;
    this.spreadsheetId = data.spreadsheetId;
    this.spreadsheetUrl = data.spreadsheetUrl;
    this.updatedIssuesAt = parseDate(data.updatedIssuesAt) ?? new Date();
  }

  public sheetId: number;
  public spreadsheetId: string;
  public spreadsheetUrl: string;
  public updatedIssuesAt: Date;
}
/**
 * ImageUploadFromUrlPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ImageUploadFromUrlPayloadFragment response data
 */
export class ImageUploadFromUrlPayload extends Request {
  public constructor(request: LinearRequest, data: L.ImageUploadFromUrlPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.url = data.url ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The URL containing the image. */
  public url?: string;
}
/**
 * An integration with an external service.
 *
 * @param request - function to call the graphql client
 * @param data - L.IntegrationFragment response data
 */
export class Integration extends Request {
  private _creator: L.IntegrationFragment["creator"];
  private _team?: L.IntegrationFragment["team"];

  public constructor(request: LinearRequest, data: L.IntegrationFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.service = data.service;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._creator = data.creator;
    this._team = data.team ?? undefined;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The integration's type. */
  public service: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user that added the integration. */
  public get creator(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._creator.id);
  }
  /** The organization that the integration is associated with. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  /** The team that the integration is associated with. */
  public get team(): LinearFetch<Team> | undefined {
    return this._team?.id ? new TeamQuery(this._request).fetch(this._team?.id) : undefined;
  }

  /** Deletes an integration. */
  public delete() {
    return new IntegrationDeleteMutation(this._request).fetch(this.id);
  }
  /** Archives an integration resource. */
  public resourceArchive() {
    return new IntegrationResourceArchiveMutation(this._request).fetch(this.id);
  }
}
/**
 * IntegrationConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this IntegrationConnection model
 * @param data - IntegrationConnection response data
 */
export class IntegrationConnection extends Connection<Integration> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Integration> | undefined>,
    data: L.IntegrationConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Integration(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * IntegrationPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IntegrationPayloadFragment response data
 */
export class IntegrationPayload extends Request {
  private _integration?: L.IntegrationPayloadFragment["integration"];

  public constructor(request: LinearRequest, data: L.IntegrationPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._integration = data.integration ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The integration that was created or updated. */
  public get integration(): LinearFetch<Integration> | undefined {
    return this._integration?.id ? new IntegrationQuery(this._request).fetch(this._integration?.id) : undefined;
  }
}
/**
 * An integration resource created by an external service.
 *
 * @param request - function to call the graphql client
 * @param data - L.IntegrationResourceFragment response data
 */
export class IntegrationResource extends Request {
  private _integration: L.IntegrationResourceFragment["integration"];
  private _issue: L.IntegrationResourceFragment["issue"];

  public constructor(request: LinearRequest, data: L.IntegrationResourceFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.resourceId = data.resourceId;
    this.resourceType = data.resourceType;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.data = new IntegrationResourceData(request, data.data);
    this.pullRequest = new PullRequestPayload(request, data.pullRequest);
    this._integration = data.integration;
    this._issue = data.issue;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The external service resource ID. */
  public resourceId: string;
  /** The integration's type. */
  public resourceType: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Detailed information about the external resource. */
  public data: IntegrationResourceData;
  /** Pull request information for GitHub pull requests and GitLab merge requests. */
  public pullRequest: PullRequestPayload;
  /** The integration that the resource is associated with. */
  public get integration(): LinearFetch<Integration> | undefined {
    return new IntegrationQuery(this._request).fetch(this._integration.id);
  }
  /** The issue that the resource is associated with. */
  public get issue(): LinearFetch<Issue> | undefined {
    return new IssueQuery(this._request).fetch(this._issue.id);
  }

  /** Archives an integration resource. */
  public archive() {
    return new IntegrationResourceArchiveMutation(this._request).fetch(this.id);
  }
}
/**
 * IntegrationResourceConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this IntegrationResourceConnection model
 * @param data - IntegrationResourceConnection response data
 */
export class IntegrationResourceConnection extends Connection<IntegrationResource> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<IntegrationResource> | undefined>,
    data: L.IntegrationResourceConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new IntegrationResource(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * Integration resource's payload
 *
 * @param request - function to call the graphql client
 * @param data - L.IntegrationResourceDataFragment response data
 */
export class IntegrationResourceData extends Request {
  public constructor(request: LinearRequest, data: L.IntegrationResourceDataFragment) {
    super(request);
    this.githubCommit = data.githubCommit ? new CommitPayload(request, data.githubCommit) : undefined;
    this.githubPullRequest = data.githubPullRequest
      ? new PullRequestPayload(request, data.githubPullRequest)
      : undefined;
    this.gitlabMergeRequest = data.gitlabMergeRequest
      ? new PullRequestPayload(request, data.gitlabMergeRequest)
      : undefined;
    this.sentryIssue = data.sentryIssue ? new SentryIssuePayload(request, data.sentryIssue) : undefined;
  }

  /** The payload for an IntegrationResource of type 'githubCommit' */
  public githubCommit?: CommitPayload;
  /** The payload for an IntegrationResource of type 'githubPullRequest' */
  public githubPullRequest?: PullRequestPayload;
  /** The payload for an IntegrationResource of type 'gitlabMergeRequest' */
  public gitlabMergeRequest?: PullRequestPayload;
  /** The payload for an IntegrationResource of type 'sentryIssue' */
  public sentryIssue?: SentryIssuePayload;
}
/**
 * The integration resource's settings
 *
 * @param request - function to call the graphql client
 * @param data - L.IntegrationSettingsFragment response data
 */
export class IntegrationSettings extends Request {
  public constructor(request: LinearRequest, data: L.IntegrationSettingsFragment) {
    super(request);
    this.googleSheets = data.googleSheets ? new GoogleSheetsSettings(request, data.googleSheets) : undefined;
    this.intercom = data.intercom ? new IntercomSettings(request, data.intercom) : undefined;
    this.jira = data.jira ? new JiraSettings(request, data.jira) : undefined;
    this.sentry = data.sentry ? new SentrySettings(request, data.sentry) : undefined;
    this.slackPost = data.slackPost ? new SlackPostSettings(request, data.slackPost) : undefined;
    this.slackProjectPost = data.slackProjectPost ? new SlackPostSettings(request, data.slackProjectPost) : undefined;
    this.zendesk = data.zendesk ? new ZendeskSettings(request, data.zendesk) : undefined;
  }

  public googleSheets?: GoogleSheetsSettings;
  public intercom?: IntercomSettings;
  public jira?: JiraSettings;
  public sentry?: SentrySettings;
  public slackPost?: SlackPostSettings;
  public slackProjectPost?: SlackPostSettings;
  public zendesk?: ZendeskSettings;
}
/**
 * Intercom specific settings.
 *
 * @param request - function to call the graphql client
 * @param data - L.IntercomSettingsFragment response data
 */
export class IntercomSettings extends Request {
  public constructor(request: LinearRequest, data: L.IntercomSettingsFragment) {
    super(request);
    this.sendNoteOnComment = data.sendNoteOnComment ?? undefined;
    this.sendNoteOnStatusChange = data.sendNoteOnStatusChange ?? undefined;
  }

  /** Whether an internal message should be added when someone comments on an issue. */
  public sendNoteOnComment?: boolean;
  /** Whether an internal message should be added when a Linear issue changes status (for status types except completed or canceled). */
  public sendNoteOnStatusChange?: boolean;
}
/**
 * Invoice model
 *
 * @param request - function to call the graphql client
 * @param data - L.InvoiceFragment response data
 */
export class Invoice extends Request {
  public constructor(request: LinearRequest, data: L.InvoiceFragment) {
    super(request);
    this.created = parseDate(data.created) ?? new Date();
    this.dueDate = data.dueDate ?? undefined;
    this.status = data.status;
    this.total = data.total;
    this.url = data.url ?? undefined;
  }

  /** The creation date of the invoice. */
  public created: Date;
  /** The due date of the invoice. */
  public dueDate?: L.Scalars["TimelessDate"];
  /** The status of the invoice. */
  public status: string;
  /** The invoice total, in cents. */
  public total: number;
  /** The URL at which the invoice can be viewed or paid. */
  public url?: string;
}
/**
 * An issue.
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueFragment response data
 */
export class Issue extends Request {
  private _assignee?: L.IssueFragment["assignee"];
  private _creator?: L.IssueFragment["creator"];
  private _cycle?: L.IssueFragment["cycle"];
  private _parent?: L.IssueFragment["parent"];
  private _project?: L.IssueFragment["project"];
  private _snoozedBy?: L.IssueFragment["snoozedBy"];
  private _state: L.IssueFragment["state"];
  private _team: L.IssueFragment["team"];

  public constructor(request: LinearRequest, data: L.IssueFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.autoArchivedAt = parseDate(data.autoArchivedAt) ?? undefined;
    this.autoClosedAt = parseDate(data.autoClosedAt) ?? undefined;
    this.boardOrder = data.boardOrder;
    this.branchName = data.branchName;
    this.canceledAt = parseDate(data.canceledAt) ?? undefined;
    this.completedAt = parseDate(data.completedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.customerTicketCount = data.customerTicketCount;
    this.description = data.description ?? undefined;
    this.dueDate = data.dueDate ?? undefined;
    this.estimate = data.estimate ?? undefined;
    this.id = data.id;
    this.identifier = data.identifier;
    this.number = data.number;
    this.previousIdentifiers = data.previousIdentifiers;
    this.priority = data.priority;
    this.priorityLabel = data.priorityLabel;
    this.snoozedUntilAt = parseDate(data.snoozedUntilAt) ?? undefined;
    this.sortOrder = data.sortOrder;
    this.startedAt = parseDate(data.startedAt) ?? undefined;
    this.subIssueSortOrder = data.subIssueSortOrder ?? undefined;
    this.title = data.title;
    this.trashed = data.trashed ?? undefined;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url;
    this._assignee = data.assignee ?? undefined;
    this._creator = data.creator ?? undefined;
    this._cycle = data.cycle ?? undefined;
    this._parent = data.parent ?? undefined;
    this._project = data.project ?? undefined;
    this._snoozedBy = data.snoozedBy ?? undefined;
    this._state = data.state;
    this._team = data.team;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the issue was automatically archived by the auto pruning process. */
  public autoArchivedAt?: Date;
  /** The time at which the issue was automatically closed by the auto pruning process. */
  public autoClosedAt?: Date;
  /** The order of the item in its column on the board. */
  public boardOrder: number;
  /** Suggested branch name for the issue. */
  public branchName: string;
  /** The time at which the issue was moved into canceled state. */
  public canceledAt?: Date;
  /** The time at which the issue was moved into completed state. */
  public completedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Returns the number of Attachment resources which are created by customer support ticketing systems (e.g. Zendesk). */
  public customerTicketCount: number;
  /** The issue's description in markdown format. */
  public description?: string;
  /** The date at which the issue is due. */
  public dueDate?: L.Scalars["TimelessDate"];
  /** The estimate of the complexity of the issue.. */
  public estimate?: number;
  /** The unique identifier of the entity. */
  public id: string;
  /** Issue's human readable identifier (e.g. ENG-123). */
  public identifier: string;
  /** The issue's unique number. */
  public number: number;
  /** Previous identifiers of the issue if it has been moved between teams. */
  public previousIdentifiers: string[];
  /** The priority of the issue. */
  public priority: number;
  /** Label for the priority. */
  public priorityLabel: string;
  /** The time until an issue will be snoozed in Triage view. */
  public snoozedUntilAt?: Date;
  /** The order of the item in relation to other items in the organization. */
  public sortOrder: number;
  /** The time at which the issue was moved into started state. */
  public startedAt?: Date;
  /** The order of the item in the sub-issue list. Only set if the issue has a parent. */
  public subIssueSortOrder?: number;
  /** The issue's title. */
  public title: string;
  /** A flag that indicates whether the issue is in the trash bin. */
  public trashed?: boolean;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Issue URL. */
  public url: string;
  /** The user to whom the issue is assigned to. */
  public get assignee(): LinearFetch<User> | undefined {
    return this._assignee?.id ? new UserQuery(this._request).fetch(this._assignee?.id) : undefined;
  }
  /** The user who created the issue. */
  public get creator(): LinearFetch<User> | undefined {
    return this._creator?.id ? new UserQuery(this._request).fetch(this._creator?.id) : undefined;
  }
  /** The cycle that the issue is associated with. */
  public get cycle(): LinearFetch<Cycle> | undefined {
    return this._cycle?.id ? new CycleQuery(this._request).fetch(this._cycle?.id) : undefined;
  }
  /** The parent of the issue. */
  public get parent(): LinearFetch<Issue> | undefined {
    return this._parent?.id ? new IssueQuery(this._request).fetch(this._parent?.id) : undefined;
  }
  /** The project that the issue is associated with. */
  public get project(): LinearFetch<Project> | undefined {
    return this._project?.id ? new ProjectQuery(this._request).fetch(this._project?.id) : undefined;
  }
  /** The user who snoozed the issue. */
  public get snoozedBy(): LinearFetch<User> | undefined {
    return this._snoozedBy?.id ? new UserQuery(this._request).fetch(this._snoozedBy?.id) : undefined;
  }
  /** The workflow state that the issue is associated with. */
  public get state(): LinearFetch<WorkflowState> | undefined {
    return new WorkflowStateQuery(this._request).fetch(this._state.id);
  }
  /** The team that the issue is associated with. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }
  /** Attachments associated with the issue. */
  public attachments(variables?: Omit<L.Issue_AttachmentsQueryVariables, "id">) {
    return new Issue_AttachmentsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Children of the issue. */
  public children(variables?: Omit<L.Issue_ChildrenQueryVariables, "id">) {
    return new Issue_ChildrenQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Comments associated with the issue. */
  public comments(variables?: Omit<L.Issue_CommentsQueryVariables, "id">) {
    return new Issue_CommentsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** History entries associated with the issue. */
  public history(variables?: Omit<L.Issue_HistoryQueryVariables, "id">) {
    return new Issue_HistoryQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Inverse relations associated with this issue. */
  public inverseRelations(variables?: Omit<L.Issue_InverseRelationsQueryVariables, "id">) {
    return new Issue_InverseRelationsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Labels associated with this issue. */
  public labels(variables?: Omit<L.Issue_LabelsQueryVariables, "id">) {
    return new Issue_LabelsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Relations associated with this issue. */
  public relations(variables?: Omit<L.Issue_RelationsQueryVariables, "id">) {
    return new Issue_RelationsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Users who are subscribed to the issue. */
  public subscribers(variables?: Omit<L.Issue_SubscribersQueryVariables, "id">) {
    return new Issue_SubscribersQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Archives an issue. */
  public archive(variables?: Omit<L.IssueArchiveMutationVariables, "id">) {
    return new IssueArchiveMutation(this._request).fetch(this.id, variables);
  }
  /** Deletes (trashes) an issue. */
  public delete() {
    return new IssueDeleteMutation(this._request).fetch(this.id);
  }
  /** Unarchives an issue. */
  public unarchive() {
    return new IssueUnarchiveMutation(this._request).fetch(this.id);
  }
  /** Updates an issue. */
  public update(input: L.IssueUpdateInput) {
    return new IssueUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * IssueBatchPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueBatchPayloadFragment response data
 */
export class IssueBatchPayload extends Request {
  public constructor(request: LinearRequest, data: L.IssueBatchPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.issues = data.issues.map(node => new Issue(request, node));
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The issues that were updated. */
  public issues: Issue[];
}
/**
 * IssueConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this IssueConnection model
 * @param data - IssueConnection response data
 */
export class IssueConnection extends Connection<Issue> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Issue> | undefined>,
    data: L.IssueConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Issue(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * IssueDescriptionHistory model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueDescriptionHistoryFragment response data
 */
export class IssueDescriptionHistory extends Request {
  public constructor(request: LinearRequest, data: L.IssueDescriptionHistoryFragment) {
    super(request);
    this.actorId = data.actorId ?? undefined;
    this.descriptionData = data.descriptionData;
    this.id = data.id;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
  }

  /** The ID of the author of the change. */
  public actorId?: string;
  /** The description data of the issue as a JSON serialized string. */
  public descriptionData: string;
  /** The UUID of the change. */
  public id: string;
  /** The type of the revision, whether it was the creation or update of the issue. */
  public type: string;
  /** The date when the description was updated. */
  public updatedAt: Date;
}
/**
 * IssueDescriptionHistoryPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueDescriptionHistoryPayloadFragment response data
 */
export class IssueDescriptionHistoryPayload extends Request {
  public constructor(request: LinearRequest, data: L.IssueDescriptionHistoryPayloadFragment) {
    super(request);
    this.success = data.success;
    this.history = data.history ? data.history.map(node => new IssueDescriptionHistory(request, node)) : undefined;
  }

  /** Whether the operation was successful. */
  public success: boolean;
  /** The issue that was created or updated. */
  public history?: IssueDescriptionHistory[];
}
/**
 * A record of changes to an issue.
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueHistoryFragment response data
 */
export class IssueHistory extends Request {
  private _actor?: L.IssueHistoryFragment["actor"];
  private _fromAssignee?: L.IssueHistoryFragment["fromAssignee"];
  private _fromCycle?: L.IssueHistoryFragment["fromCycle"];
  private _fromParent?: L.IssueHistoryFragment["fromParent"];
  private _fromProject?: L.IssueHistoryFragment["fromProject"];
  private _fromState?: L.IssueHistoryFragment["fromState"];
  private _fromTeam?: L.IssueHistoryFragment["fromTeam"];
  private _issue: L.IssueHistoryFragment["issue"];
  private _toAssignee?: L.IssueHistoryFragment["toAssignee"];
  private _toCycle?: L.IssueHistoryFragment["toCycle"];
  private _toParent?: L.IssueHistoryFragment["toParent"];
  private _toProject?: L.IssueHistoryFragment["toProject"];
  private _toState?: L.IssueHistoryFragment["toState"];
  private _toTeam?: L.IssueHistoryFragment["toTeam"];

  public constructor(request: LinearRequest, data: L.IssueHistoryFragment) {
    super(request);
    this.addedLabelIds = data.addedLabelIds ?? undefined;
    this.archived = data.archived ?? undefined;
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.autoArchived = data.autoArchived ?? undefined;
    this.autoClosed = data.autoClosed ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.fromDueDate = data.fromDueDate ?? undefined;
    this.fromEstimate = data.fromEstimate ?? undefined;
    this.fromPriority = data.fromPriority ?? undefined;
    this.fromTitle = data.fromTitle ?? undefined;
    this.id = data.id;
    this.removedLabelIds = data.removedLabelIds ?? undefined;
    this.source = parseJson(data.source) ?? undefined;
    this.toDueDate = data.toDueDate ?? undefined;
    this.toEstimate = data.toEstimate ?? undefined;
    this.toPriority = data.toPriority ?? undefined;
    this.toTitle = data.toTitle ?? undefined;
    this.trashed = data.trashed ?? undefined;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.updatedDescription = data.updatedDescription ?? undefined;
    this.issueImport = data.issueImport ? new IssueImport(request, data.issueImport) : undefined;
    this.relationChanges = data.relationChanges
      ? data.relationChanges.map(node => new IssueRelationHistoryPayload(request, node))
      : undefined;
    this._actor = data.actor ?? undefined;
    this._fromAssignee = data.fromAssignee ?? undefined;
    this._fromCycle = data.fromCycle ?? undefined;
    this._fromParent = data.fromParent ?? undefined;
    this._fromProject = data.fromProject ?? undefined;
    this._fromState = data.fromState ?? undefined;
    this._fromTeam = data.fromTeam ?? undefined;
    this._issue = data.issue;
    this._toAssignee = data.toAssignee ?? undefined;
    this._toCycle = data.toCycle ?? undefined;
    this._toParent = data.toParent ?? undefined;
    this._toProject = data.toProject ?? undefined;
    this._toState = data.toState ?? undefined;
    this._toTeam = data.toTeam ?? undefined;
  }

  /** ID's of labels that were added. */
  public addedLabelIds?: string[];
  /** Whether the issue was archived or un-archived. */
  public archived?: boolean;
  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  public autoArchived?: boolean;
  public autoClosed?: boolean;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** What the due date was changed from */
  public fromDueDate?: L.Scalars["TimelessDate"];
  /** What the estimate was changed from. */
  public fromEstimate?: number;
  /** What the priority was changed from. */
  public fromPriority?: number;
  /** What the title was changed from. */
  public fromTitle?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** ID's of labels that were removed. */
  public removedLabelIds?: string[];
  /** Information about the integration or application which created this history entry. */
  public source?: Record<string, unknown>;
  /** What the due date was changed to */
  public toDueDate?: L.Scalars["TimelessDate"];
  /** What the estimate was changed to. */
  public toEstimate?: number;
  /** What the priority was changed to. */
  public toPriority?: number;
  /** What the title was changed to. */
  public toTitle?: string;
  /** Whether the issue was trashed or un-trashed. */
  public trashed?: boolean;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Whether the issue's description was updated. */
  public updatedDescription?: boolean;
  /** Changed issue relationships. */
  public relationChanges?: IssueRelationHistoryPayload[];
  /** The import record. */
  public issueImport?: IssueImport;
  /** The user who made these changes. If null, possibly means that the change made by an integration. */
  public get actor(): LinearFetch<User> | undefined {
    return this._actor?.id ? new UserQuery(this._request).fetch(this._actor?.id) : undefined;
  }
  /** The user from whom the issue was re-assigned from. */
  public get fromAssignee(): LinearFetch<User> | undefined {
    return this._fromAssignee?.id ? new UserQuery(this._request).fetch(this._fromAssignee?.id) : undefined;
  }
  /** The previous cycle of the issue. */
  public get fromCycle(): LinearFetch<Cycle> | undefined {
    return this._fromCycle?.id ? new CycleQuery(this._request).fetch(this._fromCycle?.id) : undefined;
  }
  /** The previous parent of the issue. */
  public get fromParent(): LinearFetch<Issue> | undefined {
    return this._fromParent?.id ? new IssueQuery(this._request).fetch(this._fromParent?.id) : undefined;
  }
  /** The previous project of the issue. */
  public get fromProject(): LinearFetch<Project> | undefined {
    return this._fromProject?.id ? new ProjectQuery(this._request).fetch(this._fromProject?.id) : undefined;
  }
  /** The previous workflow state of the issue. */
  public get fromState(): LinearFetch<WorkflowState> | undefined {
    return this._fromState?.id ? new WorkflowStateQuery(this._request).fetch(this._fromState?.id) : undefined;
  }
  /** The team from which the issue was moved from. */
  public get fromTeam(): LinearFetch<Team> | undefined {
    return this._fromTeam?.id ? new TeamQuery(this._request).fetch(this._fromTeam?.id) : undefined;
  }
  /** The issue that was changed. */
  public get issue(): LinearFetch<Issue> | undefined {
    return new IssueQuery(this._request).fetch(this._issue.id);
  }
  /** The user to whom the issue was assigned to. */
  public get toAssignee(): LinearFetch<User> | undefined {
    return this._toAssignee?.id ? new UserQuery(this._request).fetch(this._toAssignee?.id) : undefined;
  }
  /** The new cycle of the issue. */
  public get toCycle(): LinearFetch<Cycle> | undefined {
    return this._toCycle?.id ? new CycleQuery(this._request).fetch(this._toCycle?.id) : undefined;
  }
  /** The new parent of the issue. */
  public get toParent(): LinearFetch<Issue> | undefined {
    return this._toParent?.id ? new IssueQuery(this._request).fetch(this._toParent?.id) : undefined;
  }
  /** The new project of the issue. */
  public get toProject(): LinearFetch<Project> | undefined {
    return this._toProject?.id ? new ProjectQuery(this._request).fetch(this._toProject?.id) : undefined;
  }
  /** The new workflow state of the issue. */
  public get toState(): LinearFetch<WorkflowState> | undefined {
    return this._toState?.id ? new WorkflowStateQuery(this._request).fetch(this._toState?.id) : undefined;
  }
  /** The team to which the issue was moved to. */
  public get toTeam(): LinearFetch<Team> | undefined {
    return this._toTeam?.id ? new TeamQuery(this._request).fetch(this._toTeam?.id) : undefined;
  }
}
/**
 * IssueHistoryConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this IssueHistoryConnection model
 * @param data - IssueHistoryConnection response data
 */
export class IssueHistoryConnection extends Connection<IssueHistory> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<IssueHistory> | undefined>,
    data: L.IssueHistoryConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new IssueHistory(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * An import job for data from an external service
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueImportFragment response data
 */
export class IssueImport extends Request {
  public constructor(request: LinearRequest, data: L.IssueImportFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.creatorId = data.creatorId;
    this.error = data.error ?? undefined;
    this.id = data.id;
    this.mapping = parseJson(data.mapping) ?? undefined;
    this.service = data.service;
    this.status = data.status;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The id for the user that started the job. */
  public creatorId: string;
  /** User readable error message, if one has occurred during the import. */
  public error?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The data mapping configuration for the import job. */
  public mapping?: Record<string, unknown>;
  /** The service from which data will be imported. */
  public service: string;
  /** The status for the import job. */
  public status: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;

  /** Deletes an import job. */
  public delete(issueImportId: string) {
    return new IssueImportDeleteMutation(this._request).fetch(issueImportId);
  }
  /** Updates the mapping for the issue import. */
  public update(input: L.IssueImportUpdateInput) {
    return new IssueImportUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * IssueImportDeletePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueImportDeletePayloadFragment response data
 */
export class IssueImportDeletePayload extends Request {
  public constructor(request: LinearRequest, data: L.IssueImportDeletePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.issueImport = data.issueImport ? new IssueImport(request, data.issueImport) : undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The import job that was deleted. */
  public issueImport?: IssueImport;
}
/**
 * IssueImportPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueImportPayloadFragment response data
 */
export class IssueImportPayload extends Request {
  public constructor(request: LinearRequest, data: L.IssueImportPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.issueImport = data.issueImport ? new IssueImport(request, data.issueImport) : undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The import job that was created or updated. */
  public issueImport?: IssueImport;
}
/**
 * Labels that can be associated with issues.
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueLabelFragment response data
 */
export class IssueLabel extends Request {
  private _creator?: L.IssueLabelFragment["creator"];
  private _team: L.IssueLabelFragment["team"];

  public constructor(request: LinearRequest, data: L.IssueLabelFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.color = data.color;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.description = data.description ?? undefined;
    this.id = data.id;
    this.name = data.name;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._creator = data.creator ?? undefined;
    this._team = data.team;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The label's color as a HEX string. */
  public color: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The label's description. */
  public description?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The label's name. */
  public name: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user who created the label. */
  public get creator(): LinearFetch<User> | undefined {
    return this._creator?.id ? new UserQuery(this._request).fetch(this._creator?.id) : undefined;
  }
  /** The team to which the label belongs to. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }
  /** Issues associated with the label. */
  public issues(variables?: Omit<L.IssueLabel_IssuesQueryVariables, "id">) {
    return new IssueLabel_IssuesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Archives an issue label. */
  public archive() {
    return new IssueLabelArchiveMutation(this._request).fetch(this.id);
  }
  /** Updates an label. */
  public update(input: L.IssueLabelUpdateInput) {
    return new IssueLabelUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * IssueLabelConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this IssueLabelConnection model
 * @param data - IssueLabelConnection response data
 */
export class IssueLabelConnection extends Connection<IssueLabel> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<IssueLabel> | undefined>,
    data: L.IssueLabelConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new IssueLabel(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * IssueLabelPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueLabelPayloadFragment response data
 */
export class IssueLabelPayload extends Request {
  private _issueLabel: L.IssueLabelPayloadFragment["issueLabel"];

  public constructor(request: LinearRequest, data: L.IssueLabelPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._issueLabel = data.issueLabel;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The label that was created or updated. */
  public get issueLabel(): LinearFetch<IssueLabel> | undefined {
    return new IssueLabelQuery(this._request).fetch(this._issueLabel.id);
  }
}
/**
 * IssuePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssuePayloadFragment response data
 */
export class IssuePayload extends Request {
  private _issue?: L.IssuePayloadFragment["issue"];

  public constructor(request: LinearRequest, data: L.IssuePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._issue = data.issue ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The issue that was created or updated. */
  public get issue(): LinearFetch<Issue> | undefined {
    return this._issue?.id ? new IssueQuery(this._request).fetch(this._issue?.id) : undefined;
  }
}
/**
 * IssuePriorityValue model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssuePriorityValueFragment response data
 */
export class IssuePriorityValue extends Request {
  public constructor(request: LinearRequest, data: L.IssuePriorityValueFragment) {
    super(request);
    this.label = data.label;
    this.priority = data.priority;
  }

  /** Priority's label. */
  public label: string;
  /** Priority's number value. */
  public priority: number;
}
/**
 * A relation between two issues.
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueRelationFragment response data
 */
export class IssueRelation extends Request {
  private _issue: L.IssueRelationFragment["issue"];
  private _relatedIssue: L.IssueRelationFragment["relatedIssue"];

  public constructor(request: LinearRequest, data: L.IssueRelationFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._issue = data.issue;
    this._relatedIssue = data.relatedIssue;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The relationship of the issue with the related issue. */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The issue whose relationship is being described. */
  public get issue(): LinearFetch<Issue> | undefined {
    return new IssueQuery(this._request).fetch(this._issue.id);
  }
  /** The related issue. */
  public get relatedIssue(): LinearFetch<Issue> | undefined {
    return new IssueQuery(this._request).fetch(this._relatedIssue.id);
  }

  /** Deletes an issue relation. */
  public delete() {
    return new IssueRelationDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates an issue relation. */
  public update(input: L.IssueRelationUpdateInput) {
    return new IssueRelationUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * IssueRelationConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this IssueRelationConnection model
 * @param data - IssueRelationConnection response data
 */
export class IssueRelationConnection extends Connection<IssueRelation> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<IssueRelation> | undefined>,
    data: L.IssueRelationConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new IssueRelation(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * Issue relation history's payload
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueRelationHistoryPayloadFragment response data
 */
export class IssueRelationHistoryPayload extends Request {
  public constructor(request: LinearRequest, data: L.IssueRelationHistoryPayloadFragment) {
    super(request);
    this.identifier = data.identifier;
    this.type = data.type;
  }

  /** The identifier of the related issue. */
  public identifier: string;
  /** The type of the change. */
  public type: string;
}
/**
 * IssueRelationPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.IssueRelationPayloadFragment response data
 */
export class IssueRelationPayload extends Request {
  private _issueRelation: L.IssueRelationPayloadFragment["issueRelation"];

  public constructor(request: LinearRequest, data: L.IssueRelationPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._issueRelation = data.issueRelation;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The issue relation that was created or updated. */
  public get issueRelation(): LinearFetch<IssueRelation> | undefined {
    return new IssueRelationQuery(this._request).fetch(this._issueRelation.id);
  }
}
/**
 * Tuple for mapping Jira projects to Linear teams.
 *
 * @param request - function to call the graphql client
 * @param data - L.JiraLinearMappingFragment response data
 */
export class JiraLinearMapping extends Request {
  public constructor(request: LinearRequest, data: L.JiraLinearMappingFragment) {
    super(request);
    this.jiraProjectId = data.jiraProjectId;
    this.linearTeamId = data.linearTeamId;
  }

  /** The Jira id for this project. */
  public jiraProjectId: string;
  /** The Linear team id to map to the given project. */
  public linearTeamId: string;
}
/**
 * Metadata about a Jira project.
 *
 * @param request - function to call the graphql client
 * @param data - L.JiraProjectDataFragment response data
 */
export class JiraProjectData extends Request {
  public constructor(request: LinearRequest, data: L.JiraProjectDataFragment) {
    super(request);
    this.id = data.id;
    this.key = data.key;
    this.name = data.name;
  }

  /** The Jira id for this project. */
  public id: string;
  /** The Jira key for this project, such as ENG. */
  public key: string;
  /** The Jira name for this project, such as Engineering. */
  public name: string;
}
/**
 * Jira specific settings.
 *
 * @param request - function to call the graphql client
 * @param data - L.JiraSettingsFragment response data
 */
export class JiraSettings extends Request {
  public constructor(request: LinearRequest, data: L.JiraSettingsFragment) {
    super(request);
    this.projectMapping = data.projectMapping
      ? data.projectMapping.map(node => new JiraLinearMapping(request, node))
      : undefined;
    this.projects = data.projects.map(node => new JiraProjectData(request, node));
  }

  /** The mapping of Jira project id => Linear team id. */
  public projectMapping?: JiraLinearMapping[];
  /** The Jira projects for the organization. */
  public projects: JiraProjectData[];
}
/**
 * A milestone that contains projects.
 *
 * @param request - function to call the graphql client
 * @param data - L.MilestoneFragment response data
 */
export class Milestone extends Request {
  public constructor(request: LinearRequest, data: L.MilestoneFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.name = data.name;
    this.sortOrder = data.sortOrder;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The name of the milestone. */
  public name: string;
  /** The sort order for the milestone. */
  public sortOrder: number;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The organization that the milestone belongs to. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  /** Projects associated with the milestone. */
  public projects(variables?: Omit<L.Milestone_ProjectsQueryVariables, "id">) {
    return new Milestone_ProjectsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Deletes a milestone. */
  public delete() {
    return new MilestoneDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates a milestone. */
  public update(input: L.MilestoneUpdateInput) {
    return new MilestoneUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * MilestoneConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this MilestoneConnection model
 * @param data - MilestoneConnection response data
 */
export class MilestoneConnection extends Connection<Milestone> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Milestone> | undefined>,
    data: L.MilestoneConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Milestone(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * MilestonePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.MilestonePayloadFragment response data
 */
export class MilestonePayload extends Request {
  private _milestone?: L.MilestonePayloadFragment["milestone"];

  public constructor(request: LinearRequest, data: L.MilestonePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._milestone = data.milestone ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The milesteone that was created or updated. */
  public get milestone(): LinearFetch<Milestone> | undefined {
    return this._milestone?.id ? new MilestoneQuery(this._request).fetch(this._milestone?.id) : undefined;
  }
}
/**
 * A notification sent to a user.
 *
 * @param request - function to call the graphql client
 * @param data - L.NotificationFragment response data
 */
export class Notification extends Request {
  private _comment?: L.NotificationFragment["comment"];
  private _issue: L.NotificationFragment["issue"];
  private _team: L.NotificationFragment["team"];
  private _user: L.NotificationFragment["user"];

  public constructor(request: LinearRequest, data: L.NotificationFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.emailedAt = parseDate(data.emailedAt) ?? undefined;
    this.id = data.id;
    this.reactionEmoji = data.reactionEmoji ?? undefined;
    this.readAt = parseDate(data.readAt) ?? undefined;
    this.snoozedUntilAt = parseDate(data.snoozedUntilAt) ?? undefined;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._comment = data.comment ?? undefined;
    this._issue = data.issue;
    this._team = data.team;
    this._user = data.user;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /**
   * The time at when an email reminder for this notification was sent to the user. Null, if no email
   *     reminder has been sent.
   */
  public emailedAt?: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** Name of the reaction emoji associated with the notification. */
  public reactionEmoji?: string;
  /** The time at when the user marked the notification as read. Null, if the the user hasn't read the notification */
  public readAt?: Date;
  /** The time until a notification will be snoozed. After that it will appear in the inbox again. */
  public snoozedUntilAt?: Date;
  /** Notification type */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The comment which the notification is associated with. */
  public get comment(): LinearFetch<Comment> | undefined {
    return this._comment?.id ? new CommentQuery(this._request).fetch(this._comment?.id) : undefined;
  }
  /** The issue that the notification is associated with. */
  public get issue(): LinearFetch<Issue> | undefined {
    return new IssueQuery(this._request).fetch(this._issue.id);
  }
  /** The team which the notification is associated with. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }
  /** The recipient of the notification. */
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }

  /** Archives a notification. */
  public archive() {
    return new NotificationArchiveMutation(this._request).fetch(this.id);
  }
  /** Unarchives a notification. */
  public unarchive() {
    return new NotificationUnarchiveMutation(this._request).fetch(this.id);
  }
  /** Updates a notification. */
  public update(input: L.NotificationUpdateInput) {
    return new NotificationUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * NotificationConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this NotificationConnection model
 * @param data - NotificationConnection response data
 */
export class NotificationConnection extends Connection<Notification> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Notification> | undefined>,
    data: L.NotificationConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Notification(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * NotificationPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.NotificationPayloadFragment response data
 */
export class NotificationPayload extends Request {
  private _notification: L.NotificationPayloadFragment["notification"];

  public constructor(request: LinearRequest, data: L.NotificationPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._notification = data.notification;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The notification that was created or updated. */
  public get notification(): LinearFetch<Notification> | undefined {
    return new NotificationQuery(this._request).fetch(this._notification.id);
  }
}
/**
 * Notification subscriptions for models.
 *
 * @param request - function to call the graphql client
 * @param data - L.NotificationSubscriptionFragment response data
 */
export class NotificationSubscription extends Request {
  private _project?: L.NotificationSubscriptionFragment["project"];
  private _team?: L.NotificationSubscriptionFragment["team"];
  private _user: L.NotificationSubscriptionFragment["user"];

  public constructor(request: LinearRequest, data: L.NotificationSubscriptionFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._project = data.project ?? undefined;
    this._team = data.team ?? undefined;
    this._user = data.user;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The type of the subscription. */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Subscribed project. */
  public get project(): LinearFetch<Project> | undefined {
    return this._project?.id ? new ProjectQuery(this._request).fetch(this._project?.id) : undefined;
  }
  /** Subscribed team. */
  public get team(): LinearFetch<Team> | undefined {
    return this._team?.id ? new TeamQuery(this._request).fetch(this._team?.id) : undefined;
  }
  /** The user associated with notification subscriptions. */
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }

  /** Deletes a notification subscription reference. */
  public delete() {
    return new NotificationSubscriptionDeleteMutation(this._request).fetch(this.id);
  }
}
/**
 * NotificationSubscriptionConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this NotificationSubscriptionConnection model
 * @param data - NotificationSubscriptionConnection response data
 */
export class NotificationSubscriptionConnection extends Connection<NotificationSubscription> {
  public constructor(
    request: LinearRequest,
    fetch: (
      connection?: LinearConnectionVariables
    ) => LinearFetch<LinearConnection<NotificationSubscription> | undefined>,
    data: L.NotificationSubscriptionConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new NotificationSubscription(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * NotificationSubscriptionPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.NotificationSubscriptionPayloadFragment response data
 */
export class NotificationSubscriptionPayload extends Request {
  private _notificationSubscription: L.NotificationSubscriptionPayloadFragment["notificationSubscription"];

  public constructor(request: LinearRequest, data: L.NotificationSubscriptionPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._notificationSubscription = data.notificationSubscription;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The notification subscription that was created or updated. */
  public get notificationSubscription(): LinearFetch<NotificationSubscription> | undefined {
    return new NotificationSubscriptionQuery(this._request).fetch(this._notificationSubscription.id);
  }
}
/**
 * OauthAuthStringAuthorizePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OauthAuthStringAuthorizePayloadFragment response data
 */
export class OauthAuthStringAuthorizePayload extends Request {
  public constructor(request: LinearRequest, data: L.OauthAuthStringAuthorizePayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * OauthAuthStringChallengePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OauthAuthStringChallengePayloadFragment response data
 */
export class OauthAuthStringChallengePayload extends Request {
  public constructor(request: LinearRequest, data: L.OauthAuthStringChallengePayloadFragment) {
    super(request);
    this.authString = data.authString;
    this.success = data.success;
  }

  /** The created authentication string. */
  public authString: string;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * OauthAuthStringCheckPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OauthAuthStringCheckPayloadFragment response data
 */
export class OauthAuthStringCheckPayload extends Request {
  public constructor(request: LinearRequest, data: L.OauthAuthStringCheckPayloadFragment) {
    super(request);
    this.success = data.success;
    this.token = data.token ?? undefined;
  }

  /** Whether the operation was successful. */
  public success: boolean;
  /** Access token for use. */
  public token?: string;
}
/**
 * OAuth2 client application
 *
 * @param request - function to call the graphql client
 * @param data - L.OauthClientFragment response data
 */
export class OauthClient extends Request {
  public constructor(request: LinearRequest, data: L.OauthClientFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.clientId = data.clientId;
    this.clientSecret = data.clientSecret;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.description = data.description;
    this.developer = data.developer;
    this.developerUrl = data.developerUrl;
    this.id = data.id;
    this.imageUrl = data.imageUrl;
    this.name = data.name;
    this.publicEnabled = data.publicEnabled;
    this.redirectUris = data.redirectUris;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.webhookResourceTypes = data.webhookResourceTypes;
    this.webhookUrl = data.webhookUrl ?? undefined;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** OAuth application's client ID. */
  public clientId: string;
  /** OAuth application's client secret. */
  public clientSecret: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Information about the application. */
  public description: string;
  /** Name of the developer. */
  public developer: string;
  /** Url of the developer. */
  public developerUrl: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** Image of the application. */
  public imageUrl: string;
  /** OAuth application's client name. */
  public name: string;
  /** Whether the OAuth application is publicly visible, or only visible to the creating workspace. */
  public publicEnabled: boolean;
  /** List of allowed redirect URIs for the application. */
  public redirectUris: string[];
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The resource types to request when creating new webhooks. */
  public webhookResourceTypes: string[];
  /** Webhook URL */
  public webhookUrl?: string;

  /** Archives an OAuth client. */
  public archive() {
    return new OauthClientArchiveMutation(this._request).fetch(this.id);
  }
  /** Updates an OAuth client. */
  public rotateSecret() {
    return new OauthClientRotateSecretMutation(this._request).fetch(this.id);
  }
  /** Updates an OAuth client. */
  public update(input: L.OauthClientUpdateInput) {
    return new OauthClientUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * OauthClientPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OauthClientPayloadFragment response data
 */
export class OauthClientPayload extends Request {
  public constructor(request: LinearRequest, data: L.OauthClientPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.oauthClient = new OauthClient(request, data.oauthClient);
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The OAuth client application that was created or updated. */
  public oauthClient: OauthClient;
}
/**
 * OauthTokenRevokePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OauthTokenRevokePayloadFragment response data
 */
export class OauthTokenRevokePayload extends Request {
  public constructor(request: LinearRequest, data: L.OauthTokenRevokePayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * An organization. Organizations are root-level objects that contain user accounts and teams.
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationFragment response data
 */
export class Organization extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationFragment) {
    super(request);
    this.allowedAuthServices = data.allowedAuthServices;
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.createdIssueCount = data.createdIssueCount;
    this.deletionRequestedAt = parseDate(data.deletionRequestedAt) ?? undefined;
    this.gitBranchFormat = data.gitBranchFormat ?? undefined;
    this.gitLinkbackMessagesEnabled = data.gitLinkbackMessagesEnabled;
    this.gitPublicLinkbackMessagesEnabled = data.gitPublicLinkbackMessagesEnabled;
    this.id = data.id;
    this.logoUrl = data.logoUrl ?? undefined;
    this.name = data.name;
    this.periodUploadVolume = data.periodUploadVolume;
    this.roadmapEnabled = data.roadmapEnabled;
    this.samlEnabled = data.samlEnabled;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.urlKey = data.urlKey;
    this.userCount = data.userCount;
  }

  /** Allowed authentication providers, empty array means all are allowed */
  public allowedAuthServices: string[];
  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Number of issues in the organization. */
  public createdIssueCount: number;
  /** The time at which deletion of the organization was requested. */
  public deletionRequestedAt?: Date;
  /** How git branches are formatted. If null, default formatting will be used. */
  public gitBranchFormat?: string;
  /** Whether the Git integration linkback messages should be sent to private repositories. */
  public gitLinkbackMessagesEnabled: boolean;
  /** Whether the Git integration linkback messages should be sent to public repositories. */
  public gitPublicLinkbackMessagesEnabled: boolean;
  /** The unique identifier of the entity. */
  public id: string;
  /** The organization's logo URL. */
  public logoUrl?: string;
  /** The organization's name. */
  public name: string;
  /** Rolling 30-day total upload volume for the organization, in megabytes. */
  public periodUploadVolume: number;
  /** Whether the organization is using a roadmap. */
  public roadmapEnabled: boolean;
  /** Whether SAML authentication is enabled for organization. */
  public samlEnabled: boolean;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The organization's unique URL key. */
  public urlKey: string;
  /** Number of active users in the organization. */
  public userCount: number;
  /** The organization's subscription to a paid plan. */
  public get subscription(): LinearFetch<Subscription | undefined> {
    return new SubscriptionQuery(this._request).fetch();
  }
  /** Integrations associated with the organization. */
  public integrations(variables?: L.Organization_IntegrationsQueryVariables) {
    return new Organization_IntegrationsQuery(this._request, variables).fetch(variables);
  }
  /** Milestones associated with the organization. */
  public milestones(variables?: L.Organization_MilestonesQueryVariables) {
    return new Organization_MilestonesQuery(this._request, variables).fetch(variables);
  }
  /** Teams associated with the organization. */
  public teams(variables?: L.Organization_TeamsQueryVariables) {
    return new Organization_TeamsQuery(this._request, variables).fetch(variables);
  }
  /** Users associated with the organization. */
  public users(variables?: L.Organization_UsersQueryVariables) {
    return new Organization_UsersQuery(this._request, variables).fetch(variables);
  }
  /** Delete's an organization. Administrator privileges required. */
  public delete(input: L.DeleteOrganizationInput) {
    return new OrganizationDeleteMutation(this._request).fetch(input);
  }
  /** Updates the user's organization. */
  public update(input: L.UpdateOrganizationInput) {
    return new OrganizationUpdateMutation(this._request).fetch(input);
  }
}
/**
 * OrganizationCancelDeletePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationCancelDeletePayloadFragment response data
 */
export class OrganizationCancelDeletePayload extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationCancelDeletePayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * OrganizationDeletePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationDeletePayloadFragment response data
 */
export class OrganizationDeletePayload extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationDeletePayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * Defines the use of a domain by an organization.
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationDomainFragment response data
 */
export class OrganizationDomain extends Request {
  private _creator?: L.OrganizationDomainFragment["creator"];

  public constructor(request: LinearRequest, data: L.OrganizationDomainFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.name = data.name;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.verificationEmail = data.verificationEmail ?? undefined;
    this.verified = data.verified;
    this._creator = data.creator ?? undefined;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** Domain name */
  public name: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** E-mail used to verify this domain */
  public verificationEmail?: string;
  /** Is this domain verified */
  public verified: boolean;
  /** The user who added the domain. */
  public get creator(): LinearFetch<User> | undefined {
    return this._creator?.id ? new UserQuery(this._request).fetch(this._creator?.id) : undefined;
  }

  /** Deletes a domain. */
  public delete() {
    return new OrganizationDomainDeleteMutation(this._request).fetch(this.id);
  }
}
/**
 * OrganizationDomainPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationDomainPayloadFragment response data
 */
export class OrganizationDomainPayload extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationDomainPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.organizationDomain = new OrganizationDomain(request, data.organizationDomain);
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The organization domain that was created or updated. */
  public organizationDomain: OrganizationDomain;
}
/**
 * OrganizationDomainSimplePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationDomainSimplePayloadFragment response data
 */
export class OrganizationDomainSimplePayload extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationDomainSimplePayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * OrganizationExistsPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationExistsPayloadFragment response data
 */
export class OrganizationExistsPayload extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationExistsPayloadFragment) {
    super(request);
    this.exists = data.exists;
    this.success = data.success;
  }

  /** Whether the organization exists. */
  public exists: boolean;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * An invitation to the organization that has been sent via email.
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationInviteFragment response data
 */
export class OrganizationInvite extends Request {
  private _invitee?: L.OrganizationInviteFragment["invitee"];
  private _inviter: L.OrganizationInviteFragment["inviter"];

  public constructor(request: LinearRequest, data: L.OrganizationInviteFragment) {
    super(request);
    this.acceptedAt = parseDate(data.acceptedAt) ?? undefined;
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.email = data.email;
    this.expiresAt = parseDate(data.expiresAt) ?? undefined;
    this.external = data.external;
    this.id = data.id;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._invitee = data.invitee ?? undefined;
    this._inviter = data.inviter;
  }

  /** The time at which the invite was accepted. Null, if the invite hasn't been accepted */
  public acceptedAt?: Date;
  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The invitees email address. */
  public email: string;
  /** The time at which the invite will be expiring. Null, if the invite shouldn't expire */
  public expiresAt?: Date;
  /** The invite was sent to external address. */
  public external: boolean;
  /** The unique identifier of the entity. */
  public id: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user who has accepted the invite. Null, if the invite hasn't been accepted. */
  public get invitee(): LinearFetch<User> | undefined {
    return this._invitee?.id ? new UserQuery(this._request).fetch(this._invitee?.id) : undefined;
  }
  /** The user who created the invitation. */
  public get inviter(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._inviter.id);
  }
  /** The organization that the invite is associated with. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }

  /** Deletes an organization invite. */
  public delete() {
    return new OrganizationInviteDeleteMutation(this._request).fetch(this.id);
  }
}
/**
 * OrganizationInviteConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this OrganizationInviteConnection model
 * @param data - OrganizationInviteConnection response data
 */
export class OrganizationInviteConnection extends Connection<OrganizationInvite> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<OrganizationInvite> | undefined>,
    data: L.OrganizationInviteConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new OrganizationInvite(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * OrganizationInviteDetailsPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationInviteDetailsPayloadFragment response data
 */
export class OrganizationInviteDetailsPayload extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationInviteDetailsPayloadFragment) {
    super(request);
    this.accepted = data.accepted;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.email = data.email;
    this.expired = data.expired;
    this.inviter = data.inviter;
    this.organizationId = data.organizationId;
    this.organizationLogoUrl = data.organizationLogoUrl ?? undefined;
    this.organizationName = data.organizationName;
  }

  /** Whether the invite has already been accepted. */
  public accepted: boolean;
  /** When the invite was created. */
  public createdAt: Date;
  /** The email of the invitee */
  public email: string;
  /** Whether the invite has expired. */
  public expired: boolean;
  /** The name of the inviter */
  public inviter: string;
  /** ID of the workspace the invite is for. */
  public organizationId: string;
  /** URL of the workspace logo the invite is for. */
  public organizationLogoUrl?: string;
  /** Name of the workspace the invite is for. */
  public organizationName: string;
}
/**
 * OrganizationInvitePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationInvitePayloadFragment response data
 */
export class OrganizationInvitePayload extends Request {
  private _organizationInvite: L.OrganizationInvitePayloadFragment["organizationInvite"];

  public constructor(request: LinearRequest, data: L.OrganizationInvitePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._organizationInvite = data.organizationInvite;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The organization invite that was created or updated. */
  public get organizationInvite(): LinearFetch<OrganizationInvite> | undefined {
    return new OrganizationInviteQuery(this._request).fetch(this._organizationInvite.id);
  }
}
/**
 * OrganizationPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.OrganizationPayloadFragment response data
 */
export class OrganizationPayload extends Request {
  public constructor(request: LinearRequest, data: L.OrganizationPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The organization that was created or updated. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
}
/**
 * PageInfo model
 *
 * @param request - function to call the graphql client
 * @param data - L.PageInfoFragment response data
 */
export class PageInfo extends Request {
  public constructor(request: LinearRequest, data: L.PageInfoFragment) {
    super(request);
    this.endCursor = data.endCursor ?? undefined;
    this.hasNextPage = data.hasNextPage;
    this.hasPreviousPage = data.hasPreviousPage;
    this.startCursor = data.startCursor ?? undefined;
  }

  /** Cursor representing the last result in the paginated results. */
  public endCursor?: string;
  /** Indicates if there are more results when paginating forward. */
  public hasNextPage: boolean;
  /** Indicates if there are more results when paginating backward. */
  public hasPreviousPage: boolean;
  /** Cursor representing the first result in the paginated results. */
  public startCursor?: string;
}
/**
 * A project.
 *
 * @param request - function to call the graphql client
 * @param data - L.ProjectFragment response data
 */
export class Project extends Request {
  private _creator: L.ProjectFragment["creator"];
  private _lead?: L.ProjectFragment["lead"];
  private _milestone?: L.ProjectFragment["milestone"];

  public constructor(request: LinearRequest, data: L.ProjectFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.autoArchivedAt = parseDate(data.autoArchivedAt) ?? undefined;
    this.canceledAt = parseDate(data.canceledAt) ?? undefined;
    this.color = data.color;
    this.completedAt = parseDate(data.completedAt) ?? undefined;
    this.completedIssueCountHistory = data.completedIssueCountHistory;
    this.completedScopeHistory = data.completedScopeHistory;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.description = data.description;
    this.icon = data.icon ?? undefined;
    this.id = data.id;
    this.issueCountHistory = data.issueCountHistory;
    this.name = data.name;
    this.progress = data.progress;
    this.scopeHistory = data.scopeHistory;
    this.slackIssueComments = data.slackIssueComments;
    this.slackIssueStatuses = data.slackIssueStatuses;
    this.slackNewIssue = data.slackNewIssue;
    this.slugId = data.slugId;
    this.sortOrder = data.sortOrder;
    this.startedAt = parseDate(data.startedAt) ?? undefined;
    this.state = data.state;
    this.targetDate = data.targetDate ?? undefined;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url;
    this._creator = data.creator;
    this._lead = data.lead ?? undefined;
    this._milestone = data.milestone ?? undefined;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the project was automatically archived by the auto pruning process. */
  public autoArchivedAt?: Date;
  /** The time at which the project was moved into canceled state. */
  public canceledAt?: Date;
  /** The project's color. */
  public color: string;
  /** The time at which the project was moved into completed state. */
  public completedAt?: Date;
  /** The number of completed issues in the project after each week. */
  public completedIssueCountHistory: number[];
  /** The number of completed estimation points after each week. */
  public completedScopeHistory: number[];
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The project's description. */
  public description: string;
  /** The icon of the project. */
  public icon?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The total number of issues in the project after each week. */
  public issueCountHistory: number[];
  /** The project's name. */
  public name: string;
  /** The overall progress of the project. This is the (completed estimate points + 0.25 * in progress estimate points) / total estimate points. */
  public progress: number;
  /** The total number of estimation points after each week. */
  public scopeHistory: number[];
  /** Whether to send new issue comment notifications to Slack. */
  public slackIssueComments: boolean;
  /** Whether to send new issue status updates to Slack. */
  public slackIssueStatuses: boolean;
  /** Whether to send new issue notifications to Slack. */
  public slackNewIssue: boolean;
  /** The project's unique URL slug. */
  public slugId: string;
  /** The sort order for the project within its milestone. */
  public sortOrder: number;
  /** The time at which the project was moved into started state. */
  public startedAt?: Date;
  /** The type of the state. */
  public state: string;
  /** The estimated completion date of the project. */
  public targetDate?: L.Scalars["TimelessDate"];
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Project URL. */
  public url: string;
  /** The user who created the project. */
  public get creator(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._creator.id);
  }
  /** The project lead. */
  public get lead(): LinearFetch<User> | undefined {
    return this._lead?.id ? new UserQuery(this._request).fetch(this._lead?.id) : undefined;
  }
  /** The milestone that this project is associated with. */
  public get milestone(): LinearFetch<Milestone> | undefined {
    return this._milestone?.id ? new MilestoneQuery(this._request).fetch(this._milestone?.id) : undefined;
  }
  /** Documents associated with the project. */
  public documents(variables?: Omit<L.Project_DocumentsQueryVariables, "id">) {
    return new Project_DocumentsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Issues associated with the project. */
  public issues(variables?: Omit<L.Project_IssuesQueryVariables, "id">) {
    return new Project_IssuesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Links associated with the project. */
  public links(variables?: Omit<L.Project_LinksQueryVariables, "id">) {
    return new Project_LinksQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Users that are members of the project. */
  public members(variables?: Omit<L.Project_MembersQueryVariables, "id">) {
    return new Project_MembersQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Teams associated with this project. */
  public teams(variables?: Omit<L.Project_TeamsQueryVariables, "id">) {
    return new Project_TeamsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Archives a project. */
  public archive() {
    return new ProjectArchiveMutation(this._request).fetch(this.id);
  }
  /** Unarchives a project. */
  public unarchive() {
    return new ProjectUnarchiveMutation(this._request).fetch(this.id);
  }
  /** Updates a project. */
  public update(input: L.ProjectUpdateInput) {
    return new ProjectUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * ProjectConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this ProjectConnection model
 * @param data - ProjectConnection response data
 */
export class ProjectConnection extends Connection<Project> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Project> | undefined>,
    data: L.ProjectConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Project(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * An external link for a project.
 *
 * @param request - function to call the graphql client
 * @param data - L.ProjectLinkFragment response data
 */
export class ProjectLink extends Request {
  private _creator: L.ProjectLinkFragment["creator"];
  private _project: L.ProjectLinkFragment["project"];

  public constructor(request: LinearRequest, data: L.ProjectLinkFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.label = data.label;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url;
    this._creator = data.creator;
    this._project = data.project;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The link's label. */
  public label: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The link's URL. */
  public url: string;
  /** The user who created the link. */
  public get creator(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._creator.id);
  }
  /** The project that the link is associated with. */
  public get project(): LinearFetch<Project> | undefined {
    return new ProjectQuery(this._request).fetch(this._project.id);
  }

  /** Deletes a project link. */
  public delete() {
    return new ProjectLinkDeleteMutation(this._request).fetch(this.id);
  }
}
/**
 * ProjectLinkConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this ProjectLinkConnection model
 * @param data - ProjectLinkConnection response data
 */
export class ProjectLinkConnection extends Connection<ProjectLink> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<ProjectLink> | undefined>,
    data: L.ProjectLinkConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new ProjectLink(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * ProjectLinkPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ProjectLinkPayloadFragment response data
 */
export class ProjectLinkPayload extends Request {
  private _projectLink: L.ProjectLinkPayloadFragment["projectLink"];

  public constructor(request: LinearRequest, data: L.ProjectLinkPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._projectLink = data.projectLink;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The project that was created or updated. */
  public get projectLink(): LinearFetch<ProjectLink> | undefined {
    return new ProjectLinkQuery(this._request).fetch(this._projectLink.id);
  }
}
/**
 * ProjectPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ProjectPayloadFragment response data
 */
export class ProjectPayload extends Request {
  private _project?: L.ProjectPayloadFragment["project"];

  public constructor(request: LinearRequest, data: L.ProjectPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._project = data.project ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The project that was created or updated. */
  public get project(): LinearFetch<Project> | undefined {
    return this._project?.id ? new ProjectQuery(this._request).fetch(this._project?.id) : undefined;
  }
}
/**
 * Pull request data
 *
 * @param request - function to call the graphql client
 * @param data - L.PullRequestPayloadFragment response data
 */
export class PullRequestPayload extends Request {
  public constructor(request: LinearRequest, data: L.PullRequestPayloadFragment) {
    super(request);
    this.branch = data.branch;
    this.closedAt = data.closedAt;
    this.createdAt = data.createdAt;
    this.draft = data.draft;
    this.id = data.id;
    this.mergedAt = data.mergedAt;
    this.number = data.number;
    this.repoLogin = data.repoLogin;
    this.repoName = data.repoName;
    this.status = data.status;
    this.title = data.title;
    this.updatedAt = data.updatedAt;
    this.url = data.url;
    this.userId = data.userId;
    this.userLogin = data.userLogin;
  }

  public branch: string;
  public closedAt: string;
  public createdAt: string;
  public draft: boolean;
  public id: string;
  public mergedAt: string;
  public number: number;
  public repoLogin: string;
  public repoName: string;
  public status: string;
  public title: string;
  public updatedAt: string;
  public url: string;
  public userId: string;
  public userLogin: string;
}
/**
 * A user's web browser push notification subscription.
 *
 * @param request - function to call the graphql client
 * @param data - L.PushSubscriptionFragment response data
 */
export class PushSubscription extends Request {
  public constructor(request: LinearRequest, data: L.PushSubscriptionFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;

  /** Deletes a push subscription. */
  public delete() {
    return new PushSubscriptionDeleteMutation(this._request).fetch(this.id);
  }
}
/**
 * PushSubscriptionConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this PushSubscriptionConnection model
 * @param data - PushSubscriptionConnection response data
 */
export class PushSubscriptionConnection extends Connection<PushSubscription> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<PushSubscription> | undefined>,
    data: L.PushSubscriptionConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new PushSubscription(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * PushSubscriptionPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.PushSubscriptionPayloadFragment response data
 */
export class PushSubscriptionPayload extends Request {
  public constructor(request: LinearRequest, data: L.PushSubscriptionPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * PushSubscriptionTestPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.PushSubscriptionTestPayloadFragment response data
 */
export class PushSubscriptionTestPayload extends Request {
  public constructor(request: LinearRequest, data: L.PushSubscriptionTestPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * A reaction associated with a comment.
 *
 * @param request - function to call the graphql client
 * @param data - L.ReactionFragment response data
 */
export class Reaction extends Request {
  private _comment: L.ReactionFragment["comment"];
  private _user: L.ReactionFragment["user"];

  public constructor(request: LinearRequest, data: L.ReactionFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.emoji = data.emoji;
    this.id = data.id;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._comment = data.comment;
    this._user = data.user;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Name of the reaction's emoji. */
  public emoji: string;
  /** The unique identifier of the entity. */
  public id: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The comment that the reaction is associated with. */
  public get comment(): LinearFetch<Comment> | undefined {
    return new CommentQuery(this._request).fetch(this._comment.id);
  }
  /** The user who reacted. */
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }

  /** Deletes a reaction. */
  public delete() {
    return new ReactionDeleteMutation(this._request).fetch(this.id);
  }
}
/**
 * ReactionConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this ReactionConnection model
 * @param data - ReactionConnection response data
 */
export class ReactionConnection extends Connection<Reaction> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Reaction> | undefined>,
    data: L.ReactionConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Reaction(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * ReactionPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ReactionPayloadFragment response data
 */
export class ReactionPayload extends Request {
  private _reaction: L.ReactionPayloadFragment["reaction"];

  public constructor(request: LinearRequest, data: L.ReactionPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._reaction = data.reaction;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  public success: boolean;
  public get reaction(): LinearFetch<Reaction> | undefined {
    return new ReactionQuery(this._request).fetch(this._reaction.id);
  }
}
/**
 * RotateSecretPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.RotateSecretPayloadFragment response data
 */
export class RotateSecretPayload extends Request {
  public constructor(request: LinearRequest, data: L.RotateSecretPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * The integration resource's settings
 *
 * @param request - function to call the graphql client
 * @param data - L.SamlConfigurationFragment response data
 */
export class SamlConfiguration extends Request {
  public constructor(request: LinearRequest, data: L.SamlConfigurationFragment) {
    super(request);
    this.allowedDomains = data.allowedDomains ?? undefined;
    this.issuerEntityId = data.issuerEntityId ?? undefined;
    this.ssoBinding = data.ssoBinding ?? undefined;
    this.ssoEndpoint = data.ssoEndpoint ?? undefined;
    this.ssoSignAlgo = data.ssoSignAlgo ?? undefined;
    this.ssoSigningCert = data.ssoSigningCert ?? undefined;
  }

  /** List of allowed email domains for SAML authentication. */
  public allowedDomains?: string[];
  /** The issuer's custom entity ID. */
  public issuerEntityId?: string;
  /** Binding method for authentication call. Can be either `post` (default) or `redirect`. */
  public ssoBinding?: string;
  /** Sign in endpoint URL for the identity provider. */
  public ssoEndpoint?: string;
  /** The algorithm of the Signing Certificate. Can be one of `sha1`, `sha256` (default), or `sha512`. */
  public ssoSignAlgo?: string;
  /** X.509 Signing Certificate in string form. */
  public ssoSigningCert?: string;
}
/**
 * SearchResultPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.SearchResultPayloadFragment response data
 */
export class SearchResultPayload extends Request {
  public constructor(request: LinearRequest, data: L.SearchResultPayloadFragment) {
    super(request);
    this.issueIds = data.issueIds;
    this.totalCount = data.totalCount;
    this.archivePayload = new ArchiveResponse(request, data.archivePayload);
  }

  /** Active issue IDs returned matching the search term. */
  public issueIds: string[];
  /** Total number of search results. */
  public totalCount: number;
  /** Archived issues matching the search term along with all their dependencies. */
  public archivePayload: ArchiveResponse;
}
/**
 * Sentry issue data
 *
 * @param request - function to call the graphql client
 * @param data - L.SentryIssuePayloadFragment response data
 */
export class SentryIssuePayload extends Request {
  public constructor(request: LinearRequest, data: L.SentryIssuePayloadFragment) {
    super(request);
    this.actorId = data.actorId;
    this.actorName = data.actorName;
    this.actorType = data.actorType;
    this.firstSeen = data.firstSeen;
    this.firstVersion = data.firstVersion ?? undefined;
    this.issueId = data.issueId;
    this.issueTitle = data.issueTitle;
    this.projectId = data.projectId;
    this.projectSlug = data.projectSlug;
    this.shortId = data.shortId;
    this.webUrl = data.webUrl;
  }

  /** The Sentry identifier of the actor who created the issue. */
  public actorId: number;
  /** The name of the Sentry actor who created this issue. */
  public actorName: string;
  /** The type of the actor who created the issue. */
  public actorType: string;
  /** The date this issue was first seen. */
  public firstSeen: string;
  /** The name of the first release version this issue appeared on, if available. */
  public firstVersion?: string;
  /** The Sentry identifier for the issue. */
  public issueId: string;
  /** The title of the issue. */
  public issueTitle: string;
  /** The Sentry identifier of the project this issue belongs to. */
  public projectId: number;
  /** The slug of the project this issue belongs to. */
  public projectSlug: string;
  /** The shortId of the issue. */
  public shortId: string;
  /** The description of the issue. */
  public webUrl: string;
}
/**
 * Sentry specific settings.
 *
 * @param request - function to call the graphql client
 * @param data - L.SentrySettingsFragment response data
 */
export class SentrySettings extends Request {
  public constructor(request: LinearRequest, data: L.SentrySettingsFragment) {
    super(request);
    this.organizationSlug = data.organizationSlug;
  }

  /** The slug of the Sentry organization being connected. */
  public organizationSlug: string;
}
/**
 * Slack notification specific settings.
 *
 * @param request - function to call the graphql client
 * @param data - L.SlackPostSettingsFragment response data
 */
export class SlackPostSettings extends Request {
  public constructor(request: LinearRequest, data: L.SlackPostSettingsFragment) {
    super(request);
    this.channel = data.channel;
    this.channelId = data.channelId;
    this.configurationUrl = data.configurationUrl;
  }

  public channel: string;
  public channelId: string;
  public configurationUrl: string;
}
/**
 * SsoUrlFromEmailResponse model
 *
 * @param request - function to call the graphql client
 * @param data - L.SsoUrlFromEmailResponseFragment response data
 */
export class SsoUrlFromEmailResponse extends Request {
  public constructor(request: LinearRequest, data: L.SsoUrlFromEmailResponseFragment) {
    super(request);
    this.samlSsoUrl = data.samlSsoUrl;
    this.success = data.success;
  }

  /** SAML SSO sign-in URL. */
  public samlSsoUrl: string;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * StepsResponse model
 *
 * @param request - function to call the graphql client
 * @param data - L.StepsResponseFragment response data
 */
export class StepsResponse extends Request {
  public constructor(request: LinearRequest, data: L.StepsResponseFragment) {
    super(request);
    this.clientIds = data.clientIds;
    this.steps = data.steps ?? undefined;
    this.version = data.version;
  }

  /** List of client IDs for the document steps. */
  public clientIds: string[];
  /** New document steps from the client. */
  public steps?: Record<string, unknown>[];
  /** Client's document version. */
  public version: number;
}
/**
 * The subscription of an organization.
 *
 * @param request - function to call the graphql client
 * @param data - L.SubscriptionFragment response data
 */
export class Subscription extends Request {
  private _creator?: L.SubscriptionFragment["creator"];

  public constructor(request: LinearRequest, data: L.SubscriptionFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.canceledAt = parseDate(data.canceledAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.nextBillingAt = parseDate(data.nextBillingAt) ?? undefined;
    this.pendingChangeType = data.pendingChangeType ?? undefined;
    this.seats = data.seats;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._creator = data.creator ?? undefined;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The date the subscription was canceled, if any. */
  public canceledAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The date the subscription will be billed next. */
  public nextBillingAt?: Date;
  /** The subscription type of a pending change. Null if no change pending. */
  public pendingChangeType?: string;
  /** The number of seats in the subscription. */
  public seats: number;
  /** The subscription type. */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The creator of the subscription. */
  public get creator(): LinearFetch<User> | undefined {
    return this._creator?.id ? new UserQuery(this._request).fetch(this._creator?.id) : undefined;
  }
  /** The organization that the subscription is associated with. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
}
/**
 * SubscriptionPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.SubscriptionPayloadFragment response data
 */
export class SubscriptionPayload extends Request {
  public constructor(request: LinearRequest, data: L.SubscriptionPayloadFragment) {
    super(request);
    this.canceledAt = parseDate(data.canceledAt) ?? undefined;
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The date the subscription was set to cancel at the end of the billing period, if any. */
  public canceledAt?: Date;
  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The subscription entity being mutated. */
  public get subscription(): LinearFetch<Subscription | undefined> {
    return new SubscriptionQuery(this._request).fetch();
  }
}
/**
 * SubscriptionSessionPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.SubscriptionSessionPayloadFragment response data
 */
export class SubscriptionSessionPayload extends Request {
  public constructor(request: LinearRequest, data: L.SubscriptionSessionPayloadFragment) {
    super(request);
    this.session = data.session ?? undefined;
  }

  /** The subscription session that was created or updated. */
  public session?: string;
}
/**
 * Contains the requested relations.
 *
 * @param request - function to call the graphql client
 * @param data - L.SyncBatchResponseFragment response data
 */
export class SyncBatchResponse extends Request {
  public constructor(request: LinearRequest, data: L.SyncBatchResponseFragment) {
    super(request);
    this.models = data.models;
  }

  /** A JSON serialized collection of relations model object. */
  public models: string;
}
/**
 * Contains a delta sync.
 *
 * @param request - function to call the graphql client
 * @param data - L.SyncDeltaResponseFragment response data
 */
export class SyncDeltaResponse extends Request {
  public constructor(request: LinearRequest, data: L.SyncDeltaResponseFragment) {
    super(request);
    this.loadMore = data.loadMore;
    this.success = data.success;
    this.updates = data.updates ?? undefined;
  }

  /** Whether the client should try loading more. */
  public loadMore: boolean;
  /** Whether loading the delta was successful. In case it wasn't, the client is instructed to do a full bootstrap. */
  public success: boolean;
  /** A JSON serialized collection of delta packets. */
  public updates?: string;
}
/**
 * Contains either the full serialized state of the application or delta packets that the requester can
 *   apply to the local data set in order to be up-to-date.
 *
 * @param request - function to call the graphql client
 * @param data - L.SyncResponseFragment response data
 */
export class SyncResponse extends Request {
  public constructor(request: LinearRequest, data: L.SyncResponseFragment) {
    super(request);
    this.databaseVersion = data.databaseVersion;
    this.delta = data.delta ?? undefined;
    this.lastSyncId = data.lastSyncId;
    this.state = data.state ?? undefined;
    this.subscribedSyncGroups = data.subscribedSyncGroups;
  }

  /** The version of the remote database. Incremented by 1 for each migration run on the database. */
  public databaseVersion: number;
  /**
   * JSON serialized delta changes that the client can apply to its local state
   *     in order to catch up with the state of the world.
   */
  public delta?: string;
  /** The last sync id covered by the response. */
  public lastSyncId: number;
  /**
   * The full state of the organization as a serialized JSON object.
   *     Mutually exclusive with the delta property
   */
  public state?: string;
  /** The sync groups that the user is subscribed to. */
  public subscribedSyncGroups: string[];
}
/**
 * SynchronizedPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.SynchronizedPayloadFragment response data
 */
export class SynchronizedPayload extends Request {
  public constructor(request: LinearRequest, data: L.SynchronizedPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
}
/**
 * An organizational unit that contains issues.
 *
 * @param request - function to call the graphql client
 * @param data - L.TeamFragment response data
 */
export class Team extends Request {
  private _activeCycle?: L.TeamFragment["activeCycle"];
  private _defaultIssueState?: L.TeamFragment["defaultIssueState"];
  private _defaultTemplateForMembers?: L.TeamFragment["defaultTemplateForMembers"];
  private _defaultTemplateForNonMembers?: L.TeamFragment["defaultTemplateForNonMembers"];
  private _draftWorkflowState?: L.TeamFragment["draftWorkflowState"];
  private _markedAsDuplicateWorkflowState?: L.TeamFragment["markedAsDuplicateWorkflowState"];
  private _mergeWorkflowState?: L.TeamFragment["mergeWorkflowState"];
  private _reviewWorkflowState?: L.TeamFragment["reviewWorkflowState"];
  private _startWorkflowState?: L.TeamFragment["startWorkflowState"];
  private _triageIssueState?: L.TeamFragment["triageIssueState"];

  public constructor(request: LinearRequest, data: L.TeamFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.autoArchivePeriod = data.autoArchivePeriod;
    this.autoClosePeriod = data.autoClosePeriod ?? undefined;
    this.autoCloseStateId = data.autoCloseStateId ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.cycleCalenderUrl = data.cycleCalenderUrl;
    this.cycleCooldownTime = data.cycleCooldownTime;
    this.cycleDuration = data.cycleDuration;
    this.cycleIssueAutoAssignCompleted = data.cycleIssueAutoAssignCompleted;
    this.cycleIssueAutoAssignStarted = data.cycleIssueAutoAssignStarted;
    this.cycleLockToActive = data.cycleLockToActive;
    this.cycleStartDay = data.cycleStartDay;
    this.cyclesEnabled = data.cyclesEnabled;
    this.defaultIssueEstimate = data.defaultIssueEstimate;
    this.defaultTemplateForMembersId = data.defaultTemplateForMembersId ?? undefined;
    this.defaultTemplateForNonMembersId = data.defaultTemplateForNonMembersId ?? undefined;
    this.description = data.description ?? undefined;
    this.groupIssueHistory = data.groupIssueHistory;
    this.id = data.id;
    this.inviteHash = data.inviteHash;
    this.issueEstimationAllowZero = data.issueEstimationAllowZero;
    this.issueEstimationExtended = data.issueEstimationExtended;
    this.issueEstimationType = data.issueEstimationType;
    this.issueOrderingNoPriorityFirst = data.issueOrderingNoPriorityFirst;
    this.key = data.key;
    this.name = data.name;
    this.private = data.private;
    this.slackIssueComments = data.slackIssueComments;
    this.slackIssueStatuses = data.slackIssueStatuses;
    this.slackNewIssue = data.slackNewIssue;
    this.timezone = data.timezone;
    this.triageEnabled = data.triageEnabled;
    this.upcomingCycleCount = data.upcomingCycleCount;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._activeCycle = data.activeCycle ?? undefined;
    this._defaultIssueState = data.defaultIssueState ?? undefined;
    this._defaultTemplateForMembers = data.defaultTemplateForMembers ?? undefined;
    this._defaultTemplateForNonMembers = data.defaultTemplateForNonMembers ?? undefined;
    this._draftWorkflowState = data.draftWorkflowState ?? undefined;
    this._markedAsDuplicateWorkflowState = data.markedAsDuplicateWorkflowState ?? undefined;
    this._mergeWorkflowState = data.mergeWorkflowState ?? undefined;
    this._reviewWorkflowState = data.reviewWorkflowState ?? undefined;
    this._startWorkflowState = data.startWorkflowState ?? undefined;
    this._triageIssueState = data.triageIssueState ?? undefined;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** Period after which automatically closed and completed issues are automatically archived in months. */
  public autoArchivePeriod: number;
  /** Period after which issues are automatically closed in months. Null/undefined means disabled. */
  public autoClosePeriod?: number;
  /** The canceled workflow state which auto closed issues will be set to. Defaults to the first canceled state. */
  public autoCloseStateId?: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Calendar feed URL (iCal) for cycles. */
  public cycleCalenderUrl: string;
  /** The cooldown time after each cycle in weeks. */
  public cycleCooldownTime: number;
  /** The duration of a cycle in weeks. */
  public cycleDuration: number;
  /** Auto assign completed issues to current cycle. */
  public cycleIssueAutoAssignCompleted: boolean;
  /** Auto assign started issues to current cycle. */
  public cycleIssueAutoAssignStarted: boolean;
  /** Only allow issues issues with cycles in Active Issues. */
  public cycleLockToActive: boolean;
  /** The day of the week that a new cycle starts. */
  public cycleStartDay: number;
  /** Whether the team uses cycles. */
  public cyclesEnabled: boolean;
  /** What to use as an default estimate for unestimated issues. */
  public defaultIssueEstimate: number;
  /** The id of the default template to use for new issues created by members of the team. */
  public defaultTemplateForMembersId?: string;
  /** The id of the default template to use for new issues created by non-members of the team. */
  public defaultTemplateForNonMembersId?: string;
  /** The team's description. */
  public description?: string;
  /** Whether to group recent issue history entries. */
  public groupIssueHistory: boolean;
  /** The unique identifier of the entity. */
  public id: string;
  /** Unique hash for the team to be used in invite URLs. */
  public inviteHash: string;
  /** Whether to allow zeros in issues estimates. */
  public issueEstimationAllowZero: boolean;
  /** Whether to add additional points to the estimate scale. */
  public issueEstimationExtended: boolean;
  /** The issue estimation type to use. */
  public issueEstimationType: string;
  /** Whether issues without priority should be sorted first. */
  public issueOrderingNoPriorityFirst: boolean;
  /** The team's unique key. The key is used in URLs. */
  public key: string;
  /** The team's name. */
  public name: string;
  /** Whether the team is private or not. */
  public private: boolean;
  /** Whether to send new issue comment notifications to Slack. */
  public slackIssueComments: boolean;
  /** Whether to send new issue status updates to Slack. */
  public slackIssueStatuses: boolean;
  /** Whether to send new issue notifications to Slack. */
  public slackNewIssue: boolean;
  /** The timezone of the team. Defaults to "America/Los_Angeles" */
  public timezone: string;
  /** Whether triage mode is enabled for the team or not. */
  public triageEnabled: boolean;
  /** How many upcoming cycles to create. */
  public upcomingCycleCount: number;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Team's currently active cycle. */
  public get activeCycle(): LinearFetch<Cycle> | undefined {
    return this._activeCycle?.id ? new CycleQuery(this._request).fetch(this._activeCycle?.id) : undefined;
  }
  /** The default workflow state into which issues are set when they are opened by team members. */
  public get defaultIssueState(): LinearFetch<WorkflowState> | undefined {
    return this._defaultIssueState?.id
      ? new WorkflowStateQuery(this._request).fetch(this._defaultIssueState?.id)
      : undefined;
  }
  /** The default template to use for new issues created by members of the team. */
  public get defaultTemplateForMembers(): LinearFetch<Template> | undefined {
    return this._defaultTemplateForMembers?.id
      ? new TemplateQuery(this._request).fetch(this._defaultTemplateForMembers?.id)
      : undefined;
  }
  /** The default template to use for new issues created by non-members of the team. */
  public get defaultTemplateForNonMembers(): LinearFetch<Template> | undefined {
    return this._defaultTemplateForNonMembers?.id
      ? new TemplateQuery(this._request).fetch(this._defaultTemplateForNonMembers?.id)
      : undefined;
  }
  /** The workflow state into which issues are moved when a PR has been opened as draft. */
  public get draftWorkflowState(): LinearFetch<WorkflowState> | undefined {
    return this._draftWorkflowState?.id
      ? new WorkflowStateQuery(this._request).fetch(this._draftWorkflowState?.id)
      : undefined;
  }
  /** The workflow state into which issues are moved when they are marked as a duplicate of another issue. Defaults to the first canceled state. */
  public get markedAsDuplicateWorkflowState(): LinearFetch<WorkflowState> | undefined {
    return this._markedAsDuplicateWorkflowState?.id
      ? new WorkflowStateQuery(this._request).fetch(this._markedAsDuplicateWorkflowState?.id)
      : undefined;
  }
  /** The workflow state into which issues are moved when a PR has been merged. */
  public get mergeWorkflowState(): LinearFetch<WorkflowState> | undefined {
    return this._mergeWorkflowState?.id
      ? new WorkflowStateQuery(this._request).fetch(this._mergeWorkflowState?.id)
      : undefined;
  }
  /** The organization that the team is associated with. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  /** The workflow state into which issues are moved when a review has been requested for the PR. */
  public get reviewWorkflowState(): LinearFetch<WorkflowState> | undefined {
    return this._reviewWorkflowState?.id
      ? new WorkflowStateQuery(this._request).fetch(this._reviewWorkflowState?.id)
      : undefined;
  }
  /** The workflow state into which issues are moved when a PR has been opened. */
  public get startWorkflowState(): LinearFetch<WorkflowState> | undefined {
    return this._startWorkflowState?.id
      ? new WorkflowStateQuery(this._request).fetch(this._startWorkflowState?.id)
      : undefined;
  }
  /** The workflow state into which issues are set when they are opened by non-team members or integrations if triage is enabled. */
  public get triageIssueState(): LinearFetch<WorkflowState> | undefined {
    return this._triageIssueState?.id
      ? new WorkflowStateQuery(this._request).fetch(this._triageIssueState?.id)
      : undefined;
  }
  /** Cycles associated with the team. */
  public cycles(variables?: Omit<L.Team_CyclesQueryVariables, "id">) {
    return new Team_CyclesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Issues associated with the team. */
  public issues(variables?: Omit<L.Team_IssuesQueryVariables, "id">) {
    return new Team_IssuesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Labels associated with the team. */
  public labels(variables?: Omit<L.Team_LabelsQueryVariables, "id">) {
    return new Team_LabelsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Users who are members of this team. */
  public members(variables?: Omit<L.Team_MembersQueryVariables, "id">) {
    return new Team_MembersQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Memberships associated with the team. For easier access of the same data, use `members` query. */
  public memberships(variables?: Omit<L.Team_MembershipsQueryVariables, "id">) {
    return new Team_MembershipsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Projects associated with the team. */
  public projects(variables?: Omit<L.Team_ProjectsQueryVariables, "id">) {
    return new Team_ProjectsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** The states that define the workflow associated with the team. */
  public states(variables?: Omit<L.Team_StatesQueryVariables, "id">) {
    return new Team_StatesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Templates associated with the team. */
  public templates(variables?: Omit<L.Team_TemplatesQueryVariables, "id">) {
    return new Team_TemplatesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Webhooks associated with the team. */
  public webhooks(variables?: Omit<L.Team_WebhooksQueryVariables, "id">) {
    return new Team_WebhooksQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Deletes a team. */
  public delete() {
    return new TeamDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates a team. */
  public update(input: L.TeamUpdateInput) {
    return new TeamUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * TeamConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this TeamConnection model
 * @param data - TeamConnection response data
 */
export class TeamConnection extends Connection<Team> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Team> | undefined>,
    data: L.TeamConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Team(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * Defines the membership of a user to a team.
 *
 * @param request - function to call the graphql client
 * @param data - L.TeamMembershipFragment response data
 */
export class TeamMembership extends Request {
  private _team: L.TeamMembershipFragment["team"];
  private _user: L.TeamMembershipFragment["user"];

  public constructor(request: LinearRequest, data: L.TeamMembershipFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.owner = data.owner ?? undefined;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._team = data.team;
    this._user = data.user;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** Whether the user is the owner of the team */
  public owner?: boolean;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The team that the membership is associated with. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }
  /** The user that the membership is associated with. */
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }

  /** Deletes a team membership. */
  public delete() {
    return new TeamMembershipDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates a team membership. */
  public update(input: L.TeamMembershipUpdateInput) {
    return new TeamMembershipUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * TeamMembershipConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this TeamMembershipConnection model
 * @param data - TeamMembershipConnection response data
 */
export class TeamMembershipConnection extends Connection<TeamMembership> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<TeamMembership> | undefined>,
    data: L.TeamMembershipConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new TeamMembership(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * TeamMembershipPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.TeamMembershipPayloadFragment response data
 */
export class TeamMembershipPayload extends Request {
  private _teamMembership?: L.TeamMembershipPayloadFragment["teamMembership"];

  public constructor(request: LinearRequest, data: L.TeamMembershipPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._teamMembership = data.teamMembership ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The team membership that was created or updated. */
  public get teamMembership(): LinearFetch<TeamMembership> | undefined {
    return this._teamMembership?.id
      ? new TeamMembershipQuery(this._request).fetch(this._teamMembership?.id)
      : undefined;
  }
}
/**
 * TeamPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.TeamPayloadFragment response data
 */
export class TeamPayload extends Request {
  private _team?: L.TeamPayloadFragment["team"];

  public constructor(request: LinearRequest, data: L.TeamPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._team = data.team ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The team that was created or updated. */
  public get team(): LinearFetch<Team> | undefined {
    return this._team?.id ? new TeamQuery(this._request).fetch(this._team?.id) : undefined;
  }
}
/**
 * A template object used for creating new issues faster.
 *
 * @param request - function to call the graphql client
 * @param data - L.TemplateFragment response data
 */
export class Template extends Request {
  private _creator?: L.TemplateFragment["creator"];
  private _team: L.TemplateFragment["team"];

  public constructor(request: LinearRequest, data: L.TemplateFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.description = data.description ?? undefined;
    this.id = data.id;
    this.name = data.name;
    this.templateData = parseJson(data.templateData) ?? {};
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._creator = data.creator ?? undefined;
    this._team = data.team;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Template description. */
  public description?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The name of the template. */
  public name: string;
  /** Template data. */
  public templateData: Record<string, unknown>;
  /** The entity type this template is for. */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user who created the template. */
  public get creator(): LinearFetch<User> | undefined {
    return this._creator?.id ? new UserQuery(this._request).fetch(this._creator?.id) : undefined;
  }
  /** The organization that the template is associated with. If null, the template is associated with a particular team. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  /** The team that the template is associated with. If null, the template is global to the workspace. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }

  /** Deletes a template. */
  public delete() {
    return new TemplateDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates an existing template. */
  public update(input: L.TemplateUpdateInput) {
    return new TemplateUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * TemplateConnection model
 *
 * @param request - function to call the graphql client
 * @param data - L.TemplateConnectionFragment response data
 */
export class TemplateConnection extends Request {
  public constructor(request: LinearRequest, data: L.TemplateConnectionFragment) {
    super(request);
    this.pageInfo = new PageInfo(request, data.pageInfo);
  }

  public pageInfo: PageInfo;
  public get nodes(): LinearFetch<Template[]> {
    return new TemplatesQuery(this._request).fetch();
  }
}
/**
 * TemplatePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.TemplatePayloadFragment response data
 */
export class TemplatePayload extends Request {
  private _template: L.TemplatePayloadFragment["template"];

  public constructor(request: LinearRequest, data: L.TemplatePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._template = data.template;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The template that was created or updated. */
  public get template(): LinearFetch<Template> | undefined {
    return new TemplateQuery(this._request).fetch(this._template.id);
  }
}
/**
 * Object representing Google Cloud upload policy, plus additional data.
 *
 * @param request - function to call the graphql client
 * @param data - L.UploadFileFragment response data
 */
export class UploadFile extends Request {
  public constructor(request: LinearRequest, data: L.UploadFileFragment) {
    super(request);
    this.assetUrl = data.assetUrl;
    this.contentType = data.contentType;
    this.filename = data.filename;
    this.metaData = parseJson(data.metaData) ?? undefined;
    this.size = data.size;
    this.uploadUrl = data.uploadUrl;
    this.headers = data.headers.map(node => new UploadFileHeader(request, node));
  }

  /** The asset URL for the uploaded file. (assigned automatically) */
  public assetUrl: string;
  /** The content type. */
  public contentType: string;
  /** The filename. */
  public filename: string;
  public metaData?: Record<string, unknown>;
  /** The size of the uploaded file. */
  public size: number;
  /** The signed URL the for the uploaded file. (assigned automatically) */
  public uploadUrl: string;
  public headers: UploadFileHeader[];
}
/**
 * UploadFileHeader model
 *
 * @param request - function to call the graphql client
 * @param data - L.UploadFileHeaderFragment response data
 */
export class UploadFileHeader extends Request {
  public constructor(request: LinearRequest, data: L.UploadFileHeaderFragment) {
    super(request);
    this.key = data.key;
    this.value = data.value;
  }

  /** Upload file header key. */
  public key: string;
  /** Upload file header value. */
  public value: string;
}
/**
 * UploadPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.UploadPayloadFragment response data
 */
export class UploadPayload extends Request {
  public constructor(request: LinearRequest, data: L.UploadPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.uploadFile = data.uploadFile ? new UploadFile(request, data.uploadFile) : undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** Object describing the file to be uploaded. */
  public uploadFile?: UploadFile;
}
/**
 * A user that has access to the the resources of an organization.
 *
 * @param request - function to call the graphql client
 * @param data - L.UserFragment response data
 */
export class User extends Request {
  public constructor(request: LinearRequest, data: L.UserFragment) {
    super(request);
    this.active = data.active;
    this.admin = data.admin;
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.avatarUrl = data.avatarUrl ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.createdIssueCount = data.createdIssueCount;
    this.disableReason = data.disableReason ?? undefined;
    this.displayName = data.displayName;
    this.email = data.email;
    this.id = data.id;
    this.inviteHash = data.inviteHash;
    this.lastSeen = parseDate(data.lastSeen) ?? undefined;
    this.name = data.name;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url;
  }

  /** Whether the user account is active or disabled (suspended). */
  public active: boolean;
  /** Whether the user is an organization administrator. */
  public admin: boolean;
  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** An URL to the user's avatar image. */
  public avatarUrl?: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Number of issues created. */
  public createdIssueCount: number;
  /** Reason why is the account disabled. */
  public disableReason?: string;
  /** The user's display (nick) name. Unique within each organization. */
  public displayName: string;
  /** The user's email address. */
  public email: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** Unique hash for the user to be used in invite URLs. */
  public inviteHash: string;
  /** The last time the user was seen online. If null, the user is currently online. */
  public lastSeen?: Date;
  /** The user's full name. */
  public name: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** User's profile URL. */
  public url: string;
  /** Organization the user belongs to. */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  /** Issues assigned to the user. */
  public assignedIssues(variables?: Omit<L.User_AssignedIssuesQueryVariables, "id">) {
    return new User_AssignedIssuesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Issues created by the user. */
  public createdIssues(variables?: Omit<L.User_CreatedIssuesQueryVariables, "id">) {
    return new User_CreatedIssuesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Memberships associated with the user. For easier access of the same data, use `teams` query. */
  public teamMemberships(variables?: Omit<L.User_TeamMembershipsQueryVariables, "id">) {
    return new User_TeamMembershipsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Teams the user is part of. */
  public teams(variables?: Omit<L.User_TeamsQueryVariables, "id">) {
    return new User_TeamsQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Updates the user's settings. */
  public settingsUpdate(input: L.UserSettingsUpdateInput) {
    return new UserSettingsUpdateMutation(this._request).fetch(this.id, input);
  }
  /** Suspends a user. Can only be called by an admin. */
  public suspend() {
    return new UserSuspendMutation(this._request).fetch(this.id);
  }
  /** Un-suspends a user. Can only be called by an admin. */
  public unsuspend() {
    return new UserUnsuspendMutation(this._request).fetch(this.id);
  }
  /** Updates a user. Only available to organization admins and the user themselves. */
  public update(input: L.UpdateUserInput) {
    return new UserUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * A user account.
 *
 * @param request - function to call the graphql client
 * @param data - L.UserAccountFragment response data
 */
export class UserAccount extends Request {
  public constructor(request: LinearRequest, data: L.UserAccountFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.email = data.email;
    this.id = data.id;
    this.name = data.name ?? undefined;
    this.service = data.service;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.users = data.users.map(node => new User(request, node));
  }

  /** The time at which the model was archived. */
  public archivedAt?: Date;
  /** The time at which the model was created. */
  public createdAt: Date;
  /** The user's email address. */
  public email: string;
  /** The models identifier. */
  public id: string;
  /** The user's name. */
  public name?: string;
  /** The authentication service used to create the account. */
  public service: string;
  /** The time at which the model was updated. */
  public updatedAt: Date;
  /** Users belonging to the account. */
  public users: User[];
}
/**
 * UserAdminPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.UserAdminPayloadFragment response data
 */
export class UserAdminPayload extends Request {
  public constructor(request: LinearRequest, data: L.UserAdminPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * Public information of the OAuth application, plus whether the application has been authorized for the given scopes.
 *
 * @param request - function to call the graphql client
 * @param data - L.UserAuthorizedApplicationFragment response data
 */
export class UserAuthorizedApplication extends Request {
  public constructor(request: LinearRequest, data: L.UserAuthorizedApplicationFragment) {
    super(request);
    this.clientId = data.clientId;
    this.createdByLinear = data.createdByLinear;
    this.description = data.description ?? undefined;
    this.developer = data.developer;
    this.developerUrl = data.developerUrl;
    this.imageUrl = data.imageUrl ?? undefined;
    this.isAuthorized = data.isAuthorized;
    this.name = data.name;
    this.webhooksEnabled = data.webhooksEnabled;
  }

  /** OAuth application's client ID. */
  public clientId: string;
  /** Whether the application was created by Linear. */
  public createdByLinear: boolean;
  /** Information about the application. */
  public description?: string;
  /** Name of the developer. */
  public developer: string;
  /** Url of the developer (homepage or docs). */
  public developerUrl: string;
  /** Image of the application. */
  public imageUrl?: string;
  /** Whether the user has authorized the application for the given scopes. */
  public isAuthorized: boolean;
  /** Application name. */
  public name: string;
  /** Whether or not webhooks are enabled for the application. */
  public webhooksEnabled: boolean;
}
/**
 * UserConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this UserConnection model
 * @param data - UserConnection response data
 */
export class UserConnection extends Connection<User> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<User> | undefined>,
    data: L.UserConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new User(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * UserPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.UserPayloadFragment response data
 */
export class UserPayload extends Request {
  private _user?: L.UserPayloadFragment["user"];

  public constructor(request: LinearRequest, data: L.UserPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._user = data.user ?? undefined;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The user that was created or updated. */
  public get user(): LinearFetch<User> | undefined {
    return this._user?.id ? new UserQuery(this._request).fetch(this._user?.id) : undefined;
  }
}
/**
 * The settings of a user as a JSON object.
 *
 * @param request - function to call the graphql client
 * @param data - L.UserSettingsFragment response data
 */
export class UserSettings extends Request {
  private _user: L.UserSettingsFragment["user"];

  public constructor(request: LinearRequest, data: L.UserSettingsFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.notificationPreferences = parseJson(data.notificationPreferences) ?? {};
    this.unsubscribedFrom = data.unsubscribedFrom;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._user = data.user;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The notification channel settings the user has selected. */
  public notificationPreferences: Record<string, unknown>;
  /** The email types the user has unsubscribed from. */
  public unsubscribedFrom: string[];
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The user associated with these settings. */
  public get user(): LinearFetch<User> | undefined {
    return new UserQuery(this._request).fetch(this._user.id);
  }

  /** Updates the user's settings. */
  public update(input: L.UserSettingsUpdateInput) {
    return new UserSettingsUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * UserSettingsFlagPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.UserSettingsFlagPayloadFragment response data
 */
export class UserSettingsFlagPayload extends Request {
  public constructor(request: LinearRequest, data: L.UserSettingsFlagPayloadFragment) {
    super(request);
    this.flag = data.flag;
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.value = data.value;
  }

  /** The flag key which was updated. */
  public flag: string;
  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The flag value after update. */
  public value: number;
}
/**
 * UserSettingsFlagsResetPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.UserSettingsFlagsResetPayloadFragment response data
 */
export class UserSettingsFlagsResetPayload extends Request {
  public constructor(request: LinearRequest, data: L.UserSettingsFlagsResetPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * UserSettingsPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.UserSettingsPayloadFragment response data
 */
export class UserSettingsPayload extends Request {
  public constructor(request: LinearRequest, data: L.UserSettingsPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The user's settings. */
  public get userSettings(): LinearFetch<UserSettings> {
    return new UserSettingsQuery(this._request).fetch();
  }
}
/**
 * UserSubscribeToNewsletterPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.UserSubscribeToNewsletterPayloadFragment response data
 */
export class UserSubscribeToNewsletterPayload extends Request {
  public constructor(request: LinearRequest, data: L.UserSubscribeToNewsletterPayloadFragment) {
    super(request);
    this.success = data.success;
  }

  /** Whether the operation was successful. */
  public success: boolean;
}
/**
 * View preferences.
 *
 * @param request - function to call the graphql client
 * @param data - L.ViewPreferencesFragment response data
 */
export class ViewPreferences extends Request {
  public constructor(request: LinearRequest, data: L.ViewPreferencesFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.id = data.id;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.viewType = data.viewType;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** The unique identifier of the entity. */
  public id: string;
  /** The view preference type. */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The view type. */
  public viewType: string;

  /** Deletes a ViewPreferences. */
  public delete() {
    return new ViewPreferencesDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates an existing ViewPreferences object. */
  public update(input: L.ViewPreferencesUpdateInput) {
    return new ViewPreferencesUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * ViewPreferencesPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.ViewPreferencesPayloadFragment response data
 */
export class ViewPreferencesPayload extends Request {
  public constructor(request: LinearRequest, data: L.ViewPreferencesPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this.viewPreferences = new ViewPreferences(request, data.viewPreferences);
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The view preferences entity being mutated. */
  public viewPreferences: ViewPreferences;
}
/**
 * A webhook used to send HTTP notifications over data updates
 *
 * @param request - function to call the graphql client
 * @param data - L.WebhookFragment response data
 */
export class Webhook extends Request {
  private _creator?: L.WebhookFragment["creator"];
  private _team: L.WebhookFragment["team"];

  public constructor(request: LinearRequest, data: L.WebhookFragment) {
    super(request);
    this.allPublicTeams = data.allPublicTeams;
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.enabled = data.enabled;
    this.id = data.id;
    this.label = data.label;
    this.resourceTypes = data.resourceTypes;
    this.secret = data.secret ?? undefined;
    this.teamIds = data.teamIds;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this.url = data.url ?? undefined;
    this._creator = data.creator ?? undefined;
    this._team = data.team;
  }

  /** Whether the Webhook is enabled for all public teams, including teams created after the webhook was created. */
  public allPublicTeams: boolean;
  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Whether the Webhook is enabled. */
  public enabled: boolean;
  /** The unique identifier of the entity. */
  public id: string;
  /** Webhook label */
  public label: string;
  /** The resource types this webhook is subscribed to. */
  public resourceTypes: string[];
  /** Secret token for verifying the origin on the recipient side. */
  public secret?: string;
  /** The ids of teams that the webhook is associated with. */
  public teamIds: string[];
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** Webhook URL */
  public url?: string;
  /** The user who created the webhook. */
  public get creator(): LinearFetch<User> | undefined {
    return this._creator?.id ? new UserQuery(this._request).fetch(this._creator?.id) : undefined;
  }
  /** The team that the webhook is associated with. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }

  /** Deletes a Webhook. */
  public delete() {
    return new WebhookDeleteMutation(this._request).fetch(this.id);
  }
  /** Updates an existing Webhook. */
  public update(input: L.WebhookUpdateInput) {
    return new WebhookUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * WebhookConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this WebhookConnection model
 * @param data - WebhookConnection response data
 */
export class WebhookConnection extends Connection<Webhook> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<Webhook> | undefined>,
    data: L.WebhookConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new Webhook(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * WebhookPayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.WebhookPayloadFragment response data
 */
export class WebhookPayload extends Request {
  private _webhook: L.WebhookPayloadFragment["webhook"];

  public constructor(request: LinearRequest, data: L.WebhookPayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._webhook = data.webhook;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The webhook entity being mutated. */
  public get webhook(): LinearFetch<Webhook> | undefined {
    return new WebhookQuery(this._request).fetch(this._webhook.id);
  }
}
/**
 * A state in a team workflow.
 *
 * @param request - function to call the graphql client
 * @param data - L.WorkflowStateFragment response data
 */
export class WorkflowState extends Request {
  private _team: L.WorkflowStateFragment["team"];

  public constructor(request: LinearRequest, data: L.WorkflowStateFragment) {
    super(request);
    this.archivedAt = parseDate(data.archivedAt) ?? undefined;
    this.color = data.color;
    this.createdAt = parseDate(data.createdAt) ?? new Date();
    this.description = data.description ?? undefined;
    this.id = data.id;
    this.name = data.name;
    this.position = data.position;
    this.type = data.type;
    this.updatedAt = parseDate(data.updatedAt) ?? new Date();
    this._team = data.team;
  }

  /** The time at which the entity was archived. Null if the entity has not been archived. */
  public archivedAt?: Date;
  /** The state's UI color as a HEX string. */
  public color: string;
  /** The time at which the entity was created. */
  public createdAt: Date;
  /** Description of the state. */
  public description?: string;
  /** The unique identifier of the entity. */
  public id: string;
  /** The state's name. */
  public name: string;
  /** The position of the state in the team flow. */
  public position: number;
  /** The type of the state. */
  public type: string;
  /**
   * The last time at which the entity was updated. This is the same as the creation time if the
   *     entity hasn't been update after creation.
   */
  public updatedAt: Date;
  /** The team to which this state belongs to. */
  public get team(): LinearFetch<Team> | undefined {
    return new TeamQuery(this._request).fetch(this._team.id);
  }
  /** Issues belonging in this state. */
  public issues(variables?: Omit<L.WorkflowState_IssuesQueryVariables, "id">) {
    return new WorkflowState_IssuesQuery(this._request, this.id, variables).fetch(variables);
  }
  /** Archives a state. Only states with issues that have all been archived can be archived. */
  public archive() {
    return new WorkflowStateArchiveMutation(this._request).fetch(this.id);
  }
  /** Updates a state. */
  public update(input: L.WorkflowStateUpdateInput) {
    return new WorkflowStateUpdateMutation(this._request).fetch(this.id, input);
  }
}
/**
 * WorkflowStateConnection model
 *
 * @param request - function to call the graphql client
 * @param fetch - function to trigger a refetch of this WorkflowStateConnection model
 * @param data - WorkflowStateConnection response data
 */
export class WorkflowStateConnection extends Connection<WorkflowState> {
  public constructor(
    request: LinearRequest,
    fetch: (connection?: LinearConnectionVariables) => LinearFetch<LinearConnection<WorkflowState> | undefined>,
    data: L.WorkflowStateConnectionFragment
  ) {
    super(
      request,
      fetch,
      data.nodes.map(node => new WorkflowState(request, node)),
      new PageInfo(request, data.pageInfo)
    );
  }
}
/**
 * WorkflowStatePayload model
 *
 * @param request - function to call the graphql client
 * @param data - L.WorkflowStatePayloadFragment response data
 */
export class WorkflowStatePayload extends Request {
  private _workflowState: L.WorkflowStatePayloadFragment["workflowState"];

  public constructor(request: LinearRequest, data: L.WorkflowStatePayloadFragment) {
    super(request);
    this.lastSyncId = data.lastSyncId;
    this.success = data.success;
    this._workflowState = data.workflowState;
  }

  /** The identifier of the last sync operation. */
  public lastSyncId: number;
  /** Whether the operation was successful. */
  public success: boolean;
  /** The state that was created or updated. */
  public get workflowState(): LinearFetch<WorkflowState> | undefined {
    return new WorkflowStateQuery(this._request).fetch(this._workflowState.id);
  }
}
/**
 * Zendesk specific settings.
 *
 * @param request - function to call the graphql client
 * @param data - L.ZendeskSettingsFragment response data
 */
export class ZendeskSettings extends Request {
  public constructor(request: LinearRequest, data: L.ZendeskSettingsFragment) {
    super(request);
    this.botUserId = data.botUserId;
    this.subdomain = data.subdomain;
    this.url = data.url;
  }

  /** The ID of the Linear bot user. */
  public botUserId: string;
  /** The subdomain of the Zendesk organization being connected. */
  public subdomain: string;
  /** The URL of the connected Zendesk organization. */
  public url: string;
}
/**
 * A fetchable AdministrableTeams Query
 *
 * @param request - function to call the graphql client
 */
export class AdministrableTeamsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AdministrableTeams query and return a TeamConnection
   *
   * @param variables - variables to pass into the AdministrableTeamsQuery
   * @returns parsed response from AdministrableTeamsQuery
   */
  public async fetch(variables?: L.AdministrableTeamsQueryVariables): LinearFetch<TeamConnection> {
    const response = await this._request<L.AdministrableTeamsQuery, L.AdministrableTeamsQueryVariables>(
      L.AdministrableTeamsDocument,
      variables
    );
    const data = response.administrableTeams;
    return new TeamConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable ApplicationWithAuthorization Query
 *
 * @param request - function to call the graphql client
 */
export class ApplicationWithAuthorizationQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ApplicationWithAuthorization query and return a UserAuthorizedApplication
   *
   * @param clientId - required clientId to pass to applicationWithAuthorization
   * @param scope - required scope to pass to applicationWithAuthorization
   * @param variables - variables without 'clientId', 'scope' to pass into the ApplicationWithAuthorizationQuery
   * @returns parsed response from ApplicationWithAuthorizationQuery
   */
  public async fetch(
    clientId: string,
    scope: string[],
    variables?: Omit<L.ApplicationWithAuthorizationQueryVariables, "clientId" | "scope">
  ): LinearFetch<UserAuthorizedApplication> {
    const response = await this._request<
      L.ApplicationWithAuthorizationQuery,
      L.ApplicationWithAuthorizationQueryVariables
    >(L.ApplicationWithAuthorizationDocument, {
      clientId,
      scope,
      ...variables,
    });
    const data = response.applicationWithAuthorization;
    return new UserAuthorizedApplication(this._request, data);
  }
}

/**
 * A fetchable Attachment Query
 *
 * @param request - function to call the graphql client
 */
export class AttachmentQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Attachment query and return a Attachment
   *
   * @param id - required id to pass to attachment
   * @returns parsed response from AttachmentQuery
   */
  public async fetch(id: string): LinearFetch<Attachment> {
    const response = await this._request<L.AttachmentQuery, L.AttachmentQueryVariables>(L.AttachmentDocument, {
      id,
    });
    const data = response.attachment;
    return new Attachment(this._request, data);
  }
}

/**
 * A fetchable AttachmentIssue Query
 *
 * @param request - function to call the graphql client
 */
export class AttachmentIssueQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentIssue query and return a Issue
   *
   * @param id - required id to pass to attachmentIssue
   * @returns parsed response from AttachmentIssueQuery
   */
  public async fetch(id: string): LinearFetch<Issue> {
    const response = await this._request<L.AttachmentIssueQuery, L.AttachmentIssueQueryVariables>(
      L.AttachmentIssueDocument,
      {
        id,
      }
    );
    const data = response.attachmentIssue;
    return new Issue(this._request, data);
  }
}

/**
 * A fetchable Attachments Query
 *
 * @param request - function to call the graphql client
 */
export class AttachmentsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Attachments query and return a AttachmentConnection
   *
   * @param variables - variables to pass into the AttachmentsQuery
   * @returns parsed response from AttachmentsQuery
   */
  public async fetch(variables?: L.AttachmentsQueryVariables): LinearFetch<AttachmentConnection> {
    const response = await this._request<L.AttachmentsQuery, L.AttachmentsQueryVariables>(
      L.AttachmentsDocument,
      variables
    );
    const data = response.attachments;
    return new AttachmentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentsForUrl Query
 *
 * @param request - function to call the graphql client
 */
export class AttachmentsForUrlQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentsForUrl query and return a AttachmentConnection
   *
   * @param url - required url to pass to attachmentsForURL
   * @param variables - variables without 'url' to pass into the AttachmentsForUrlQuery
   * @returns parsed response from AttachmentsForUrlQuery
   */
  public async fetch(
    url: string,
    variables?: Omit<L.AttachmentsForUrlQueryVariables, "url">
  ): LinearFetch<AttachmentConnection> {
    const response = await this._request<L.AttachmentsForUrlQuery, L.AttachmentsForUrlQueryVariables>(
      L.AttachmentsForUrlDocument,
      {
        url,
        ...variables,
      }
    );
    const data = response.attachmentsForURL;
    return new AttachmentConnection(
      this._request,
      connection =>
        this.fetch(
          url,
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AuditEntries Query
 *
 * @param request - function to call the graphql client
 */
export class AuditEntriesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AuditEntries query and return a AuditEntryConnection
   *
   * @param variables - variables to pass into the AuditEntriesQuery
   * @returns parsed response from AuditEntriesQuery
   */
  public async fetch(variables?: L.AuditEntriesQueryVariables): LinearFetch<AuditEntryConnection> {
    const response = await this._request<L.AuditEntriesQuery, L.AuditEntriesQueryVariables>(
      L.AuditEntriesDocument,
      variables
    );
    const data = response.auditEntries;
    return new AuditEntryConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AuditEntryTypes Query
 *
 * @param request - function to call the graphql client
 */
export class AuditEntryTypesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AuditEntryTypes query and return a AuditEntryType list
   *
   * @returns parsed response from AuditEntryTypesQuery
   */
  public async fetch(): LinearFetch<AuditEntryType[]> {
    const response = await this._request<L.AuditEntryTypesQuery, L.AuditEntryTypesQueryVariables>(
      L.AuditEntryTypesDocument,
      {}
    );
    const data = response.auditEntryTypes;
    return data.map(node => new AuditEntryType(this._request, node));
  }
}

/**
 * A fetchable AuthorizedApplications Query
 *
 * @param request - function to call the graphql client
 */
export class AuthorizedApplicationsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AuthorizedApplications query and return a AuthorizedApplication list
   *
   * @returns parsed response from AuthorizedApplicationsQuery
   */
  public async fetch(): LinearFetch<AuthorizedApplication[]> {
    const response = await this._request<L.AuthorizedApplicationsQuery, L.AuthorizedApplicationsQueryVariables>(
      L.AuthorizedApplicationsDocument,
      {}
    );
    const data = response.authorizedApplications;
    return data.map(node => new AuthorizedApplication(this._request, node));
  }
}

/**
 * A fetchable AvailableUsers Query
 *
 * @param request - function to call the graphql client
 */
export class AvailableUsersQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AvailableUsers query and return a AuthResolverResponse
   *
   * @returns parsed response from AvailableUsersQuery
   */
  public async fetch(): LinearFetch<AuthResolverResponse> {
    const response = await this._request<L.AvailableUsersQuery, L.AvailableUsersQueryVariables>(
      L.AvailableUsersDocument,
      {}
    );
    const data = response.availableUsers;
    return new AuthResolverResponse(this._request, data);
  }
}

/**
 * A fetchable BillingDetails Query
 *
 * @param request - function to call the graphql client
 */
export class BillingDetailsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the BillingDetails query and return a BillingDetailsPayload
   *
   * @returns parsed response from BillingDetailsQuery
   */
  public async fetch(): LinearFetch<BillingDetailsPayload> {
    const response = await this._request<L.BillingDetailsQuery, L.BillingDetailsQueryVariables>(
      L.BillingDetailsDocument,
      {}
    );
    const data = response.billingDetails;
    return new BillingDetailsPayload(this._request, data);
  }
}

/**
 * A fetchable CollaborativeDocumentJoin Query
 *
 * @param request - function to call the graphql client
 */
export class CollaborativeDocumentJoinQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CollaborativeDocumentJoin query and return a CollaborationDocumentUpdatePayload
   *
   * @param clientId - required clientId to pass to collaborativeDocumentJoin
   * @param issueId - required issueId to pass to collaborativeDocumentJoin
   * @param version - required version to pass to collaborativeDocumentJoin
   * @returns parsed response from CollaborativeDocumentJoinQuery
   */
  public async fetch(
    clientId: string,
    issueId: string,
    version: number
  ): LinearFetch<CollaborationDocumentUpdatePayload> {
    const response = await this._request<L.CollaborativeDocumentJoinQuery, L.CollaborativeDocumentJoinQueryVariables>(
      L.CollaborativeDocumentJoinDocument,
      {
        clientId,
        issueId,
        version,
      }
    );
    const data = response.collaborativeDocumentJoin;
    return new CollaborationDocumentUpdatePayload(this._request, data);
  }
}

/**
 * A fetchable Comment Query
 *
 * @param request - function to call the graphql client
 */
export class CommentQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Comment query and return a Comment
   *
   * @param id - required id to pass to comment
   * @returns parsed response from CommentQuery
   */
  public async fetch(id: string): LinearFetch<Comment> {
    const response = await this._request<L.CommentQuery, L.CommentQueryVariables>(L.CommentDocument, {
      id,
    });
    const data = response.comment;
    return new Comment(this._request, data);
  }
}

/**
 * A fetchable Comments Query
 *
 * @param request - function to call the graphql client
 */
export class CommentsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Comments query and return a CommentConnection
   *
   * @param variables - variables to pass into the CommentsQuery
   * @returns parsed response from CommentsQuery
   */
  public async fetch(variables?: L.CommentsQueryVariables): LinearFetch<CommentConnection> {
    const response = await this._request<L.CommentsQuery, L.CommentsQueryVariables>(L.CommentsDocument, variables);
    const data = response.comments;
    return new CommentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable CustomView Query
 *
 * @param request - function to call the graphql client
 */
export class CustomViewQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CustomView query and return a CustomView
   *
   * @param id - required id to pass to customView
   * @returns parsed response from CustomViewQuery
   */
  public async fetch(id: string): LinearFetch<CustomView> {
    const response = await this._request<L.CustomViewQuery, L.CustomViewQueryVariables>(L.CustomViewDocument, {
      id,
    });
    const data = response.customView;
    return new CustomView(this._request, data);
  }
}

/**
 * A fetchable CustomViews Query
 *
 * @param request - function to call the graphql client
 */
export class CustomViewsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CustomViews query and return a CustomViewConnection
   *
   * @param variables - variables to pass into the CustomViewsQuery
   * @returns parsed response from CustomViewsQuery
   */
  public async fetch(variables?: L.CustomViewsQueryVariables): LinearFetch<CustomViewConnection> {
    const response = await this._request<L.CustomViewsQuery, L.CustomViewsQueryVariables>(
      L.CustomViewsDocument,
      variables
    );
    const data = response.customViews;
    return new CustomViewConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Cycle Query
 *
 * @param request - function to call the graphql client
 */
export class CycleQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Cycle query and return a Cycle
   *
   * @param id - required id to pass to cycle
   * @returns parsed response from CycleQuery
   */
  public async fetch(id: string): LinearFetch<Cycle> {
    const response = await this._request<L.CycleQuery, L.CycleQueryVariables>(L.CycleDocument, {
      id,
    });
    const data = response.cycle;
    return new Cycle(this._request, data);
  }
}

/**
 * A fetchable Cycles Query
 *
 * @param request - function to call the graphql client
 */
export class CyclesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Cycles query and return a CycleConnection
   *
   * @param variables - variables to pass into the CyclesQuery
   * @returns parsed response from CyclesQuery
   */
  public async fetch(variables?: L.CyclesQueryVariables): LinearFetch<CycleConnection> {
    const response = await this._request<L.CyclesQuery, L.CyclesQueryVariables>(L.CyclesDocument, variables);
    const data = response.cycles;
    return new CycleConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Document Query
 *
 * @param request - function to call the graphql client
 */
export class DocumentQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Document query and return a Document
   *
   * @param id - required id to pass to document
   * @returns parsed response from DocumentQuery
   */
  public async fetch(id: string): LinearFetch<Document> {
    const response = await this._request<L.DocumentQuery, L.DocumentQueryVariables>(L.DocumentDocument, {
      id,
    });
    const data = response.document;
    return new Document(this._request, data);
  }
}

/**
 * A fetchable Documents Query
 *
 * @param request - function to call the graphql client
 */
export class DocumentsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Documents query and return a DocumentConnection
   *
   * @param variables - variables to pass into the DocumentsQuery
   * @returns parsed response from DocumentsQuery
   */
  public async fetch(variables?: L.DocumentsQueryVariables): LinearFetch<DocumentConnection> {
    const response = await this._request<L.DocumentsQuery, L.DocumentsQueryVariables>(L.DocumentsDocument, variables);
    const data = response.documents;
    return new DocumentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Emoji Query
 *
 * @param request - function to call the graphql client
 */
export class EmojiQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Emoji query and return a Emoji
   *
   * @param id - required id to pass to emoji
   * @returns parsed response from EmojiQuery
   */
  public async fetch(id: string): LinearFetch<Emoji> {
    const response = await this._request<L.EmojiQuery, L.EmojiQueryVariables>(L.EmojiDocument, {
      id,
    });
    const data = response.emoji;
    return new Emoji(this._request, data);
  }
}

/**
 * A fetchable Emojis Query
 *
 * @param request - function to call the graphql client
 */
export class EmojisQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Emojis query and return a EmojiConnection
   *
   * @param variables - variables to pass into the EmojisQuery
   * @returns parsed response from EmojisQuery
   */
  public async fetch(variables?: L.EmojisQueryVariables): LinearFetch<EmojiConnection> {
    const response = await this._request<L.EmojisQuery, L.EmojisQueryVariables>(L.EmojisDocument, variables);
    const data = response.emojis;
    return new EmojiConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Favorite Query
 *
 * @param request - function to call the graphql client
 */
export class FavoriteQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Favorite query and return a Favorite
   *
   * @param id - required id to pass to favorite
   * @returns parsed response from FavoriteQuery
   */
  public async fetch(id: string): LinearFetch<Favorite> {
    const response = await this._request<L.FavoriteQuery, L.FavoriteQueryVariables>(L.FavoriteDocument, {
      id,
    });
    const data = response.favorite;
    return new Favorite(this._request, data);
  }
}

/**
 * A fetchable Favorites Query
 *
 * @param request - function to call the graphql client
 */
export class FavoritesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Favorites query and return a FavoriteConnection
   *
   * @param variables - variables to pass into the FavoritesQuery
   * @returns parsed response from FavoritesQuery
   */
  public async fetch(variables?: L.FavoritesQueryVariables): LinearFetch<FavoriteConnection> {
    const response = await this._request<L.FavoritesQuery, L.FavoritesQueryVariables>(L.FavoritesDocument, variables);
    const data = response.favorites;
    return new FavoriteConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable FigmaEmbedInfo Query
 *
 * @param request - function to call the graphql client
 */
export class FigmaEmbedInfoQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the FigmaEmbedInfo query and return a FigmaEmbedPayload
   *
   * @param fileId - required fileId to pass to figmaEmbedInfo
   * @param variables - variables without 'fileId' to pass into the FigmaEmbedInfoQuery
   * @returns parsed response from FigmaEmbedInfoQuery
   */
  public async fetch(
    fileId: string,
    variables?: Omit<L.FigmaEmbedInfoQueryVariables, "fileId">
  ): LinearFetch<FigmaEmbedPayload> {
    const response = await this._request<L.FigmaEmbedInfoQuery, L.FigmaEmbedInfoQueryVariables>(
      L.FigmaEmbedInfoDocument,
      {
        fileId,
        ...variables,
      }
    );
    const data = response.figmaEmbedInfo;
    return new FigmaEmbedPayload(this._request, data);
  }
}

/**
 * A fetchable Integration Query
 *
 * @param request - function to call the graphql client
 */
export class IntegrationQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Integration query and return a Integration
   *
   * @param id - required id to pass to integration
   * @returns parsed response from IntegrationQuery
   */
  public async fetch(id: string): LinearFetch<Integration> {
    const response = await this._request<L.IntegrationQuery, L.IntegrationQueryVariables>(L.IntegrationDocument, {
      id,
    });
    const data = response.integration;
    return new Integration(this._request, data);
  }
}

/**
 * A fetchable Integrations Query
 *
 * @param request - function to call the graphql client
 */
export class IntegrationsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Integrations query and return a IntegrationConnection
   *
   * @param variables - variables to pass into the IntegrationsQuery
   * @returns parsed response from IntegrationsQuery
   */
  public async fetch(variables?: L.IntegrationsQueryVariables): LinearFetch<IntegrationConnection> {
    const response = await this._request<L.IntegrationsQuery, L.IntegrationsQueryVariables>(
      L.IntegrationsDocument,
      variables
    );
    const data = response.integrations;
    return new IntegrationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue Query
 *
 * @param request - function to call the graphql client
 */
export class IssueQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Issue query and return a Issue
   *
   * @param id - required id to pass to issue
   * @returns parsed response from IssueQuery
   */
  public async fetch(id: string): LinearFetch<Issue> {
    const response = await this._request<L.IssueQuery, L.IssueQueryVariables>(L.IssueDocument, {
      id,
    });
    const data = response.issue;
    return new Issue(this._request, data);
  }
}

/**
 * A fetchable IssueImportFinishGithubOAuth Query
 *
 * @param request - function to call the graphql client
 */
export class IssueImportFinishGithubOAuthQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportFinishGithubOAuth query and return a GithubOAuthTokenPayload
   *
   * @param code - required code to pass to issueImportFinishGithubOAuth
   * @returns parsed response from IssueImportFinishGithubOAuthQuery
   */
  public async fetch(code: string): LinearFetch<GithubOAuthTokenPayload> {
    const response = await this._request<
      L.IssueImportFinishGithubOAuthQuery,
      L.IssueImportFinishGithubOAuthQueryVariables
    >(L.IssueImportFinishGithubOAuthDocument, {
      code,
    });
    const data = response.issueImportFinishGithubOAuth;
    return new GithubOAuthTokenPayload(this._request, data);
  }
}

/**
 * A fetchable IssueLabel Query
 *
 * @param request - function to call the graphql client
 */
export class IssueLabelQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueLabel query and return a IssueLabel
   *
   * @param id - required id to pass to issueLabel
   * @returns parsed response from IssueLabelQuery
   */
  public async fetch(id: string): LinearFetch<IssueLabel> {
    const response = await this._request<L.IssueLabelQuery, L.IssueLabelQueryVariables>(L.IssueLabelDocument, {
      id,
    });
    const data = response.issueLabel;
    return new IssueLabel(this._request, data);
  }
}

/**
 * A fetchable IssueLabels Query
 *
 * @param request - function to call the graphql client
 */
export class IssueLabelsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueLabels query and return a IssueLabelConnection
   *
   * @param variables - variables to pass into the IssueLabelsQuery
   * @returns parsed response from IssueLabelsQuery
   */
  public async fetch(variables?: L.IssueLabelsQueryVariables): LinearFetch<IssueLabelConnection> {
    const response = await this._request<L.IssueLabelsQuery, L.IssueLabelsQueryVariables>(
      L.IssueLabelsDocument,
      variables
    );
    const data = response.issueLabels;
    return new IssueLabelConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable IssuePriorityValues Query
 *
 * @param request - function to call the graphql client
 */
export class IssuePriorityValuesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssuePriorityValues query and return a IssuePriorityValue list
   *
   * @returns parsed response from IssuePriorityValuesQuery
   */
  public async fetch(): LinearFetch<IssuePriorityValue[]> {
    const response = await this._request<L.IssuePriorityValuesQuery, L.IssuePriorityValuesQueryVariables>(
      L.IssuePriorityValuesDocument,
      {}
    );
    const data = response.issuePriorityValues;
    return data.map(node => new IssuePriorityValue(this._request, node));
  }
}

/**
 * A fetchable IssueRelation Query
 *
 * @param request - function to call the graphql client
 */
export class IssueRelationQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueRelation query and return a IssueRelation
   *
   * @param id - required id to pass to issueRelation
   * @returns parsed response from IssueRelationQuery
   */
  public async fetch(id: string): LinearFetch<IssueRelation> {
    const response = await this._request<L.IssueRelationQuery, L.IssueRelationQueryVariables>(L.IssueRelationDocument, {
      id,
    });
    const data = response.issueRelation;
    return new IssueRelation(this._request, data);
  }
}

/**
 * A fetchable IssueRelations Query
 *
 * @param request - function to call the graphql client
 */
export class IssueRelationsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueRelations query and return a IssueRelationConnection
   *
   * @param variables - variables to pass into the IssueRelationsQuery
   * @returns parsed response from IssueRelationsQuery
   */
  public async fetch(variables?: L.IssueRelationsQueryVariables): LinearFetch<IssueRelationConnection> {
    const response = await this._request<L.IssueRelationsQuery, L.IssueRelationsQueryVariables>(
      L.IssueRelationsDocument,
      variables
    );
    const data = response.issueRelations;
    return new IssueRelationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable IssueSearch Query
 *
 * @param request - function to call the graphql client
 */
export class IssueSearchQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueSearch query and return a IssueConnection
   *
   * @param query - required query to pass to issueSearch
   * @param variables - variables without 'query' to pass into the IssueSearchQuery
   * @returns parsed response from IssueSearchQuery
   */
  public async fetch(
    query: string,
    variables?: Omit<L.IssueSearchQueryVariables, "query">
  ): LinearFetch<IssueConnection> {
    const response = await this._request<L.IssueSearchQuery, L.IssueSearchQueryVariables>(L.IssueSearchDocument, {
      query,
      ...variables,
    });
    const data = response.issueSearch;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          query,
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issues Query
 *
 * @param request - function to call the graphql client
 */
export class IssuesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Issues query and return a IssueConnection
   *
   * @param variables - variables to pass into the IssuesQuery
   * @returns parsed response from IssuesQuery
   */
  public async fetch(variables?: L.IssuesQueryVariables): LinearFetch<IssueConnection> {
    const response = await this._request<L.IssuesQuery, L.IssuesQueryVariables>(L.IssuesDocument, variables);
    const data = response.issues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Milestone Query
 *
 * @param request - function to call the graphql client
 */
export class MilestoneQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Milestone query and return a Milestone
   *
   * @param id - required id to pass to milestone
   * @returns parsed response from MilestoneQuery
   */
  public async fetch(id: string): LinearFetch<Milestone> {
    const response = await this._request<L.MilestoneQuery, L.MilestoneQueryVariables>(L.MilestoneDocument, {
      id,
    });
    const data = response.milestone;
    return new Milestone(this._request, data);
  }
}

/**
 * A fetchable Milestones Query
 *
 * @param request - function to call the graphql client
 */
export class MilestonesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Milestones query and return a MilestoneConnection
   *
   * @param variables - variables to pass into the MilestonesQuery
   * @returns parsed response from MilestonesQuery
   */
  public async fetch(variables?: L.MilestonesQueryVariables): LinearFetch<MilestoneConnection> {
    const response = await this._request<L.MilestonesQuery, L.MilestonesQueryVariables>(
      L.MilestonesDocument,
      variables
    );
    const data = response.milestones;
    return new MilestoneConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Notification Query
 *
 * @param request - function to call the graphql client
 */
export class NotificationQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Notification query and return a Notification
   *
   * @param id - required id to pass to notification
   * @returns parsed response from NotificationQuery
   */
  public async fetch(id: string): LinearFetch<Notification> {
    const response = await this._request<L.NotificationQuery, L.NotificationQueryVariables>(L.NotificationDocument, {
      id,
    });
    const data = response.notification;
    return new Notification(this._request, data);
  }
}

/**
 * A fetchable NotificationSubscription Query
 *
 * @param request - function to call the graphql client
 */
export class NotificationSubscriptionQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationSubscription query and return a NotificationSubscription
   *
   * @param id - required id to pass to notificationSubscription
   * @returns parsed response from NotificationSubscriptionQuery
   */
  public async fetch(id: string): LinearFetch<NotificationSubscription> {
    const response = await this._request<L.NotificationSubscriptionQuery, L.NotificationSubscriptionQueryVariables>(
      L.NotificationSubscriptionDocument,
      {
        id,
      }
    );
    const data = response.notificationSubscription;
    return new NotificationSubscription(this._request, data);
  }
}

/**
 * A fetchable NotificationSubscriptions Query
 *
 * @param request - function to call the graphql client
 */
export class NotificationSubscriptionsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationSubscriptions query and return a NotificationSubscriptionConnection
   *
   * @param variables - variables to pass into the NotificationSubscriptionsQuery
   * @returns parsed response from NotificationSubscriptionsQuery
   */
  public async fetch(
    variables?: L.NotificationSubscriptionsQueryVariables
  ): LinearFetch<NotificationSubscriptionConnection> {
    const response = await this._request<L.NotificationSubscriptionsQuery, L.NotificationSubscriptionsQueryVariables>(
      L.NotificationSubscriptionsDocument,
      variables
    );
    const data = response.notificationSubscriptions;
    return new NotificationSubscriptionConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Notifications Query
 *
 * @param request - function to call the graphql client
 */
export class NotificationsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Notifications query and return a NotificationConnection
   *
   * @param variables - variables to pass into the NotificationsQuery
   * @returns parsed response from NotificationsQuery
   */
  public async fetch(variables?: L.NotificationsQueryVariables): LinearFetch<NotificationConnection> {
    const response = await this._request<L.NotificationsQuery, L.NotificationsQueryVariables>(
      L.NotificationsDocument,
      variables
    );
    const data = response.notifications;
    return new NotificationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Organization Query
 *
 * @param request - function to call the graphql client
 */
export class OrganizationQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Organization query and return a Organization
   *
   * @returns parsed response from OrganizationQuery
   */
  public async fetch(): LinearFetch<Organization> {
    const response = await this._request<L.OrganizationQuery, L.OrganizationQueryVariables>(L.OrganizationDocument, {});
    const data = response.organization;
    return new Organization(this._request, data);
  }
}

/**
 * A fetchable OrganizationExists Query
 *
 * @param request - function to call the graphql client
 */
export class OrganizationExistsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationExists query and return a OrganizationExistsPayload
   *
   * @param urlKey - required urlKey to pass to organizationExists
   * @returns parsed response from OrganizationExistsQuery
   */
  public async fetch(urlKey: string): LinearFetch<OrganizationExistsPayload> {
    const response = await this._request<L.OrganizationExistsQuery, L.OrganizationExistsQueryVariables>(
      L.OrganizationExistsDocument,
      {
        urlKey,
      }
    );
    const data = response.organizationExists;
    return new OrganizationExistsPayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationInvite Query
 *
 * @param request - function to call the graphql client
 */
export class OrganizationInviteQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationInvite query and return a OrganizationInvite
   *
   * @param id - required id to pass to organizationInvite
   * @returns parsed response from OrganizationInviteQuery
   */
  public async fetch(id: string): LinearFetch<OrganizationInvite> {
    const response = await this._request<L.OrganizationInviteQuery, L.OrganizationInviteQueryVariables>(
      L.OrganizationInviteDocument,
      {
        id,
      }
    );
    const data = response.organizationInvite;
    return new OrganizationInvite(this._request, data);
  }
}

/**
 * A fetchable OrganizationInviteDetails Query
 *
 * @param request - function to call the graphql client
 */
export class OrganizationInviteDetailsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationInviteDetails query and return a OrganizationInviteDetailsPayload
   *
   * @param id - required id to pass to organizationInviteDetails
   * @returns parsed response from OrganizationInviteDetailsQuery
   */
  public async fetch(id: string): LinearFetch<OrganizationInviteDetailsPayload> {
    const response = await this._request<L.OrganizationInviteDetailsQuery, L.OrganizationInviteDetailsQueryVariables>(
      L.OrganizationInviteDetailsDocument,
      {
        id,
      }
    );
    const data = response.organizationInviteDetails;
    return new OrganizationInviteDetailsPayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationInvites Query
 *
 * @param request - function to call the graphql client
 */
export class OrganizationInvitesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationInvites query and return a OrganizationInviteConnection
   *
   * @param variables - variables to pass into the OrganizationInvitesQuery
   * @returns parsed response from OrganizationInvitesQuery
   */
  public async fetch(variables?: L.OrganizationInvitesQueryVariables): LinearFetch<OrganizationInviteConnection> {
    const response = await this._request<L.OrganizationInvitesQuery, L.OrganizationInvitesQueryVariables>(
      L.OrganizationInvitesDocument,
      variables
    );
    const data = response.organizationInvites;
    return new OrganizationInviteConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Project Query
 *
 * @param request - function to call the graphql client
 */
export class ProjectQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Project query and return a Project
   *
   * @param id - required id to pass to project
   * @returns parsed response from ProjectQuery
   */
  public async fetch(id: string): LinearFetch<Project> {
    const response = await this._request<L.ProjectQuery, L.ProjectQueryVariables>(L.ProjectDocument, {
      id,
    });
    const data = response.project;
    return new Project(this._request, data);
  }
}

/**
 * A fetchable ProjectLink Query
 *
 * @param request - function to call the graphql client
 */
export class ProjectLinkQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectLink query and return a ProjectLink
   *
   * @param id - required id to pass to projectLink
   * @returns parsed response from ProjectLinkQuery
   */
  public async fetch(id: string): LinearFetch<ProjectLink> {
    const response = await this._request<L.ProjectLinkQuery, L.ProjectLinkQueryVariables>(L.ProjectLinkDocument, {
      id,
    });
    const data = response.projectLink;
    return new ProjectLink(this._request, data);
  }
}

/**
 * A fetchable ProjectLinks Query
 *
 * @param request - function to call the graphql client
 */
export class ProjectLinksQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectLinks query and return a ProjectLinkConnection
   *
   * @param variables - variables to pass into the ProjectLinksQuery
   * @returns parsed response from ProjectLinksQuery
   */
  public async fetch(variables?: L.ProjectLinksQueryVariables): LinearFetch<ProjectLinkConnection> {
    const response = await this._request<L.ProjectLinksQuery, L.ProjectLinksQueryVariables>(
      L.ProjectLinksDocument,
      variables
    );
    const data = response.projectLinks;
    return new ProjectLinkConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Projects Query
 *
 * @param request - function to call the graphql client
 */
export class ProjectsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Projects query and return a ProjectConnection
   *
   * @param variables - variables to pass into the ProjectsQuery
   * @returns parsed response from ProjectsQuery
   */
  public async fetch(variables?: L.ProjectsQueryVariables): LinearFetch<ProjectConnection> {
    const response = await this._request<L.ProjectsQuery, L.ProjectsQueryVariables>(L.ProjectsDocument, variables);
    const data = response.projects;
    return new ProjectConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable PushSubscriptionTest Query
 *
 * @param request - function to call the graphql client
 */
export class PushSubscriptionTestQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the PushSubscriptionTest query and return a PushSubscriptionTestPayload
   *
   * @returns parsed response from PushSubscriptionTestQuery
   */
  public async fetch(): LinearFetch<PushSubscriptionTestPayload> {
    const response = await this._request<L.PushSubscriptionTestQuery, L.PushSubscriptionTestQueryVariables>(
      L.PushSubscriptionTestDocument,
      {}
    );
    const data = response.pushSubscriptionTest;
    return new PushSubscriptionTestPayload(this._request, data);
  }
}

/**
 * A fetchable Reaction Query
 *
 * @param request - function to call the graphql client
 */
export class ReactionQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Reaction query and return a Reaction
   *
   * @param id - required id to pass to reaction
   * @returns parsed response from ReactionQuery
   */
  public async fetch(id: string): LinearFetch<Reaction> {
    const response = await this._request<L.ReactionQuery, L.ReactionQueryVariables>(L.ReactionDocument, {
      id,
    });
    const data = response.reaction;
    return new Reaction(this._request, data);
  }
}

/**
 * A fetchable Reactions Query
 *
 * @param request - function to call the graphql client
 */
export class ReactionsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Reactions query and return a ReactionConnection
   *
   * @param variables - variables to pass into the ReactionsQuery
   * @returns parsed response from ReactionsQuery
   */
  public async fetch(variables?: L.ReactionsQueryVariables): LinearFetch<ReactionConnection> {
    const response = await this._request<L.ReactionsQuery, L.ReactionsQueryVariables>(L.ReactionsDocument, variables);
    const data = response.reactions;
    return new ReactionConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable SsoUrlFromEmail Query
 *
 * @param request - function to call the graphql client
 */
export class SsoUrlFromEmailQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the SsoUrlFromEmail query and return a SsoUrlFromEmailResponse
   *
   * @param email - required email to pass to ssoUrlFromEmail
   * @param variables - variables without 'email' to pass into the SsoUrlFromEmailQuery
   * @returns parsed response from SsoUrlFromEmailQuery
   */
  public async fetch(
    email: string,
    variables?: Omit<L.SsoUrlFromEmailQueryVariables, "email">
  ): LinearFetch<SsoUrlFromEmailResponse> {
    const response = await this._request<L.SsoUrlFromEmailQuery, L.SsoUrlFromEmailQueryVariables>(
      L.SsoUrlFromEmailDocument,
      {
        email,
        ...variables,
      }
    );
    const data = response.ssoUrlFromEmail;
    return new SsoUrlFromEmailResponse(this._request, data);
  }
}

/**
 * A fetchable Subscription Query
 *
 * @param request - function to call the graphql client
 */
export class SubscriptionQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Subscription query and return a Subscription
   *
   * @returns parsed response from SubscriptionQuery
   */
  public async fetch(): LinearFetch<Subscription | undefined> {
    const response = await this._request<L.SubscriptionQuery, L.SubscriptionQueryVariables>(L.SubscriptionDocument, {});
    const data = response.subscription;
    return data ? new Subscription(this._request, data) : undefined;
  }
}

/**
 * A fetchable Team Query
 *
 * @param request - function to call the graphql client
 */
export class TeamQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Team query and return a Team
   *
   * @param id - required id to pass to team
   * @returns parsed response from TeamQuery
   */
  public async fetch(id: string): LinearFetch<Team> {
    const response = await this._request<L.TeamQuery, L.TeamQueryVariables>(L.TeamDocument, {
      id,
    });
    const data = response.team;
    return new Team(this._request, data);
  }
}

/**
 * A fetchable TeamMembership Query
 *
 * @param request - function to call the graphql client
 */
export class TeamMembershipQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamMembership query and return a TeamMembership
   *
   * @param id - required id to pass to teamMembership
   * @returns parsed response from TeamMembershipQuery
   */
  public async fetch(id: string): LinearFetch<TeamMembership> {
    const response = await this._request<L.TeamMembershipQuery, L.TeamMembershipQueryVariables>(
      L.TeamMembershipDocument,
      {
        id,
      }
    );
    const data = response.teamMembership;
    return new TeamMembership(this._request, data);
  }
}

/**
 * A fetchable TeamMemberships Query
 *
 * @param request - function to call the graphql client
 */
export class TeamMembershipsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamMemberships query and return a TeamMembershipConnection
   *
   * @param variables - variables to pass into the TeamMembershipsQuery
   * @returns parsed response from TeamMembershipsQuery
   */
  public async fetch(variables?: L.TeamMembershipsQueryVariables): LinearFetch<TeamMembershipConnection> {
    const response = await this._request<L.TeamMembershipsQuery, L.TeamMembershipsQueryVariables>(
      L.TeamMembershipsDocument,
      variables
    );
    const data = response.teamMemberships;
    return new TeamMembershipConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Teams Query
 *
 * @param request - function to call the graphql client
 */
export class TeamsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Teams query and return a TeamConnection
   *
   * @param variables - variables to pass into the TeamsQuery
   * @returns parsed response from TeamsQuery
   */
  public async fetch(variables?: L.TeamsQueryVariables): LinearFetch<TeamConnection> {
    const response = await this._request<L.TeamsQuery, L.TeamsQueryVariables>(L.TeamsDocument, variables);
    const data = response.teams;
    return new TeamConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Template Query
 *
 * @param request - function to call the graphql client
 */
export class TemplateQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Template query and return a Template
   *
   * @param id - required id to pass to template
   * @returns parsed response from TemplateQuery
   */
  public async fetch(id: string): LinearFetch<Template> {
    const response = await this._request<L.TemplateQuery, L.TemplateQueryVariables>(L.TemplateDocument, {
      id,
    });
    const data = response.template;
    return new Template(this._request, data);
  }
}

/**
 * A fetchable Templates Query
 *
 * @param request - function to call the graphql client
 */
export class TemplatesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Templates query and return a Template list
   *
   * @returns parsed response from TemplatesQuery
   */
  public async fetch(): LinearFetch<Template[]> {
    const response = await this._request<L.TemplatesQuery, L.TemplatesQueryVariables>(L.TemplatesDocument, {});
    const data = response.templates;
    return data.map(node => new Template(this._request, node));
  }
}

/**
 * A fetchable User Query
 *
 * @param request - function to call the graphql client
 */
export class UserQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the User query and return a User
   *
   * @param id - required id to pass to user
   * @returns parsed response from UserQuery
   */
  public async fetch(id: string): LinearFetch<User> {
    const response = await this._request<L.UserQuery, L.UserQueryVariables>(L.UserDocument, {
      id,
    });
    const data = response.user;
    return new User(this._request, data);
  }
}

/**
 * A fetchable UserSettings Query
 *
 * @param request - function to call the graphql client
 */
export class UserSettingsQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserSettings query and return a UserSettings
   *
   * @returns parsed response from UserSettingsQuery
   */
  public async fetch(): LinearFetch<UserSettings> {
    const response = await this._request<L.UserSettingsQuery, L.UserSettingsQueryVariables>(L.UserSettingsDocument, {});
    const data = response.userSettings;
    return new UserSettings(this._request, data);
  }
}

/**
 * A fetchable Users Query
 *
 * @param request - function to call the graphql client
 */
export class UsersQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Users query and return a UserConnection
   *
   * @param variables - variables to pass into the UsersQuery
   * @returns parsed response from UsersQuery
   */
  public async fetch(variables?: L.UsersQueryVariables): LinearFetch<UserConnection> {
    const response = await this._request<L.UsersQuery, L.UsersQueryVariables>(L.UsersDocument, variables);
    const data = response.users;
    return new UserConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Viewer Query
 *
 * @param request - function to call the graphql client
 */
export class ViewerQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Viewer query and return a User
   *
   * @returns parsed response from ViewerQuery
   */
  public async fetch(): LinearFetch<User> {
    const response = await this._request<L.ViewerQuery, L.ViewerQueryVariables>(L.ViewerDocument, {});
    const data = response.viewer;
    return new User(this._request, data);
  }
}

/**
 * A fetchable Webhook Query
 *
 * @param request - function to call the graphql client
 */
export class WebhookQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Webhook query and return a Webhook
   *
   * @param id - required id to pass to webhook
   * @returns parsed response from WebhookQuery
   */
  public async fetch(id: string): LinearFetch<Webhook> {
    const response = await this._request<L.WebhookQuery, L.WebhookQueryVariables>(L.WebhookDocument, {
      id,
    });
    const data = response.webhook;
    return new Webhook(this._request, data);
  }
}

/**
 * A fetchable Webhooks Query
 *
 * @param request - function to call the graphql client
 */
export class WebhooksQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the Webhooks query and return a WebhookConnection
   *
   * @param variables - variables to pass into the WebhooksQuery
   * @returns parsed response from WebhooksQuery
   */
  public async fetch(variables?: L.WebhooksQueryVariables): LinearFetch<WebhookConnection> {
    const response = await this._request<L.WebhooksQuery, L.WebhooksQueryVariables>(L.WebhooksDocument, variables);
    const data = response.webhooks;
    return new WebhookConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable WorkflowState Query
 *
 * @param request - function to call the graphql client
 */
export class WorkflowStateQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WorkflowState query and return a WorkflowState
   *
   * @param id - required id to pass to workflowState
   * @returns parsed response from WorkflowStateQuery
   */
  public async fetch(id: string): LinearFetch<WorkflowState> {
    const response = await this._request<L.WorkflowStateQuery, L.WorkflowStateQueryVariables>(L.WorkflowStateDocument, {
      id,
    });
    const data = response.workflowState;
    return new WorkflowState(this._request, data);
  }
}

/**
 * A fetchable WorkflowStates Query
 *
 * @param request - function to call the graphql client
 */
export class WorkflowStatesQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WorkflowStates query and return a WorkflowStateConnection
   *
   * @param variables - variables to pass into the WorkflowStatesQuery
   * @returns parsed response from WorkflowStatesQuery
   */
  public async fetch(variables?: L.WorkflowStatesQueryVariables): LinearFetch<WorkflowStateConnection> {
    const response = await this._request<L.WorkflowStatesQuery, L.WorkflowStatesQueryVariables>(
      L.WorkflowStatesDocument,
      variables
    );
    const data = response.workflowStates;
    return new WorkflowStateConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to attachmentArchive
   * @returns parsed response from AttachmentArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.AttachmentArchiveMutation, L.AttachmentArchiveMutationVariables>(
      L.AttachmentArchiveDocument,
      {
        id,
      }
    );
    const data = response.attachmentArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentCreate mutation and return a AttachmentPayload
   *
   * @param input - required input to pass to attachmentCreate
   * @returns parsed response from AttachmentCreateMutation
   */
  public async fetch(input: L.AttachmentCreateInput): LinearFetch<AttachmentPayload> {
    const response = await this._request<L.AttachmentCreateMutation, L.AttachmentCreateMutationVariables>(
      L.AttachmentCreateDocument,
      {
        input,
      }
    );
    const data = response.attachmentCreate;
    return new AttachmentPayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to attachmentDelete
   * @returns parsed response from AttachmentDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.AttachmentDeleteMutation, L.AttachmentDeleteMutationVariables>(
      L.AttachmentDeleteDocument,
      {
        id,
      }
    );
    const data = response.attachmentDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentLinkFront Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentLinkFrontMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentLinkFront mutation and return a FrontAttachmentPayload
   *
   * @param conversationId - required conversationId to pass to attachmentLinkFront
   * @param issueId - required issueId to pass to attachmentLinkFront
   * @returns parsed response from AttachmentLinkFrontMutation
   */
  public async fetch(conversationId: string, issueId: string): LinearFetch<FrontAttachmentPayload> {
    const response = await this._request<L.AttachmentLinkFrontMutation, L.AttachmentLinkFrontMutationVariables>(
      L.AttachmentLinkFrontDocument,
      {
        conversationId,
        issueId,
      }
    );
    const data = response.attachmentLinkFront;
    return new FrontAttachmentPayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentLinkIntercom Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentLinkIntercomMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentLinkIntercom mutation and return a AttachmentPayload
   *
   * @param conversationId - required conversationId to pass to attachmentLinkIntercom
   * @param issueId - required issueId to pass to attachmentLinkIntercom
   * @returns parsed response from AttachmentLinkIntercomMutation
   */
  public async fetch(conversationId: string, issueId: string): LinearFetch<AttachmentPayload> {
    const response = await this._request<L.AttachmentLinkIntercomMutation, L.AttachmentLinkIntercomMutationVariables>(
      L.AttachmentLinkIntercomDocument,
      {
        conversationId,
        issueId,
      }
    );
    const data = response.attachmentLinkIntercom;
    return new AttachmentPayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentLinkUrl Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentLinkUrlMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentLinkUrl mutation and return a AttachmentPayload
   *
   * @param issueId - required issueId to pass to attachmentLinkURL
   * @param url - required url to pass to attachmentLinkURL
   * @param variables - variables without 'issueId', 'url' to pass into the AttachmentLinkUrlMutation
   * @returns parsed response from AttachmentLinkUrlMutation
   */
  public async fetch(
    issueId: string,
    url: string,
    variables?: Omit<L.AttachmentLinkUrlMutationVariables, "issueId" | "url">
  ): LinearFetch<AttachmentPayload> {
    const response = await this._request<L.AttachmentLinkUrlMutation, L.AttachmentLinkUrlMutationVariables>(
      L.AttachmentLinkUrlDocument,
      {
        issueId,
        url,
        ...variables,
      }
    );
    const data = response.attachmentLinkURL;
    return new AttachmentPayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentLinkZendesk Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentLinkZendeskMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentLinkZendesk mutation and return a AttachmentPayload
   *
   * @param issueId - required issueId to pass to attachmentLinkZendesk
   * @param ticketId - required ticketId to pass to attachmentLinkZendesk
   * @returns parsed response from AttachmentLinkZendeskMutation
   */
  public async fetch(issueId: string, ticketId: string): LinearFetch<AttachmentPayload> {
    const response = await this._request<L.AttachmentLinkZendeskMutation, L.AttachmentLinkZendeskMutationVariables>(
      L.AttachmentLinkZendeskDocument,
      {
        issueId,
        ticketId,
      }
    );
    const data = response.attachmentLinkZendesk;
    return new AttachmentPayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class AttachmentUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the AttachmentUpdate mutation and return a AttachmentPayload
   *
   * @param id - required id to pass to attachmentUpdate
   * @param input - required input to pass to attachmentUpdate
   * @returns parsed response from AttachmentUpdateMutation
   */
  public async fetch(id: string, input: L.AttachmentUpdateInput): LinearFetch<AttachmentPayload> {
    const response = await this._request<L.AttachmentUpdateMutation, L.AttachmentUpdateMutationVariables>(
      L.AttachmentUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.attachmentUpdate;
    return new AttachmentPayload(this._request, data);
  }
}

/**
 * A fetchable BillingEmailUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class BillingEmailUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the BillingEmailUpdate mutation and return a BillingEmailPayload
   *
   * @param input - required input to pass to billingEmailUpdate
   * @returns parsed response from BillingEmailUpdateMutation
   */
  public async fetch(input: L.BillingEmailUpdateInput): LinearFetch<BillingEmailPayload> {
    const response = await this._request<L.BillingEmailUpdateMutation, L.BillingEmailUpdateMutationVariables>(
      L.BillingEmailUpdateDocument,
      {
        input,
      }
    );
    const data = response.billingEmailUpdate;
    return new BillingEmailPayload(this._request, data);
  }
}

/**
 * A fetchable CollaborativeDocumentUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class CollaborativeDocumentUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CollaborativeDocumentUpdate mutation and return a CollaborationDocumentUpdatePayload
   *
   * @param input - required input to pass to collaborativeDocumentUpdate
   * @returns parsed response from CollaborativeDocumentUpdateMutation
   */
  public async fetch(input: L.CollaborationDocumentUpdateInput): LinearFetch<CollaborationDocumentUpdatePayload> {
    const response = await this._request<
      L.CollaborativeDocumentUpdateMutation,
      L.CollaborativeDocumentUpdateMutationVariables
    >(L.CollaborativeDocumentUpdateDocument, {
      input,
    });
    const data = response.collaborativeDocumentUpdate;
    return new CollaborationDocumentUpdatePayload(this._request, data);
  }
}

/**
 * A fetchable CommentCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class CommentCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CommentCreate mutation and return a CommentPayload
   *
   * @param input - required input to pass to commentCreate
   * @returns parsed response from CommentCreateMutation
   */
  public async fetch(input: L.CommentCreateInput): LinearFetch<CommentPayload> {
    const response = await this._request<L.CommentCreateMutation, L.CommentCreateMutationVariables>(
      L.CommentCreateDocument,
      {
        input,
      }
    );
    const data = response.commentCreate;
    return new CommentPayload(this._request, data);
  }
}

/**
 * A fetchable CommentDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class CommentDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CommentDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to commentDelete
   * @returns parsed response from CommentDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.CommentDeleteMutation, L.CommentDeleteMutationVariables>(
      L.CommentDeleteDocument,
      {
        id,
      }
    );
    const data = response.commentDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable CommentUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class CommentUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CommentUpdate mutation and return a CommentPayload
   *
   * @param id - required id to pass to commentUpdate
   * @param input - required input to pass to commentUpdate
   * @returns parsed response from CommentUpdateMutation
   */
  public async fetch(id: string, input: L.CommentUpdateInput): LinearFetch<CommentPayload> {
    const response = await this._request<L.CommentUpdateMutation, L.CommentUpdateMutationVariables>(
      L.CommentUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.commentUpdate;
    return new CommentPayload(this._request, data);
  }
}

/**
 * A fetchable ContactCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class ContactCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ContactCreate mutation and return a ContactPayload
   *
   * @param input - required input to pass to contactCreate
   * @returns parsed response from ContactCreateMutation
   */
  public async fetch(input: L.ContactCreateInput): LinearFetch<ContactPayload> {
    const response = await this._request<L.ContactCreateMutation, L.ContactCreateMutationVariables>(
      L.ContactCreateDocument,
      {
        input,
      }
    );
    const data = response.contactCreate;
    return new ContactPayload(this._request, data);
  }
}

/**
 * A fetchable CreateCsvExportReport Mutation
 *
 * @param request - function to call the graphql client
 */
export class CreateCsvExportReportMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CreateCsvExportReport mutation and return a CreateCsvExportReportPayload
   *
   * @param variables - variables to pass into the CreateCsvExportReportMutation
   * @returns parsed response from CreateCsvExportReportMutation
   */
  public async fetch(variables?: L.CreateCsvExportReportMutationVariables): LinearFetch<CreateCsvExportReportPayload> {
    const response = await this._request<L.CreateCsvExportReportMutation, L.CreateCsvExportReportMutationVariables>(
      L.CreateCsvExportReportDocument,
      variables
    );
    const data = response.createCsvExportReport;
    return new CreateCsvExportReportPayload(this._request, data);
  }
}

/**
 * A fetchable CreateOrganizationFromOnboarding Mutation
 *
 * @param request - function to call the graphql client
 */
export class CreateOrganizationFromOnboardingMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CreateOrganizationFromOnboarding mutation and return a CreateOrJoinOrganizationResponse
   *
   * @param input - required input to pass to createOrganizationFromOnboarding
   * @param variables - variables without 'input' to pass into the CreateOrganizationFromOnboardingMutation
   * @returns parsed response from CreateOrganizationFromOnboardingMutation
   */
  public async fetch(
    input: L.CreateOrganizationInput,
    variables?: Omit<L.CreateOrganizationFromOnboardingMutationVariables, "input">
  ): LinearFetch<CreateOrJoinOrganizationResponse> {
    const response = await this._request<
      L.CreateOrganizationFromOnboardingMutation,
      L.CreateOrganizationFromOnboardingMutationVariables
    >(L.CreateOrganizationFromOnboardingDocument, {
      input,
      ...variables,
    });
    const data = response.createOrganizationFromOnboarding;
    return new CreateOrJoinOrganizationResponse(this._request, data);
  }
}

/**
 * A fetchable CustomViewCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class CustomViewCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CustomViewCreate mutation and return a CustomViewPayload
   *
   * @param input - required input to pass to customViewCreate
   * @returns parsed response from CustomViewCreateMutation
   */
  public async fetch(input: L.CustomViewCreateInput): LinearFetch<CustomViewPayload> {
    const response = await this._request<L.CustomViewCreateMutation, L.CustomViewCreateMutationVariables>(
      L.CustomViewCreateDocument,
      {
        input,
      }
    );
    const data = response.customViewCreate;
    return new CustomViewPayload(this._request, data);
  }
}

/**
 * A fetchable CustomViewDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class CustomViewDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CustomViewDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to customViewDelete
   * @returns parsed response from CustomViewDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.CustomViewDeleteMutation, L.CustomViewDeleteMutationVariables>(
      L.CustomViewDeleteDocument,
      {
        id,
      }
    );
    const data = response.customViewDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable CustomViewUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class CustomViewUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CustomViewUpdate mutation and return a CustomViewPayload
   *
   * @param id - required id to pass to customViewUpdate
   * @param input - required input to pass to customViewUpdate
   * @returns parsed response from CustomViewUpdateMutation
   */
  public async fetch(id: string, input: L.CustomViewUpdateInput): LinearFetch<CustomViewPayload> {
    const response = await this._request<L.CustomViewUpdateMutation, L.CustomViewUpdateMutationVariables>(
      L.CustomViewUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.customViewUpdate;
    return new CustomViewPayload(this._request, data);
  }
}

/**
 * A fetchable CycleArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class CycleArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CycleArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to cycleArchive
   * @returns parsed response from CycleArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.CycleArchiveMutation, L.CycleArchiveMutationVariables>(
      L.CycleArchiveDocument,
      {
        id,
      }
    );
    const data = response.cycleArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable CycleCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class CycleCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CycleCreate mutation and return a CyclePayload
   *
   * @param input - required input to pass to cycleCreate
   * @returns parsed response from CycleCreateMutation
   */
  public async fetch(input: L.CycleCreateInput): LinearFetch<CyclePayload> {
    const response = await this._request<L.CycleCreateMutation, L.CycleCreateMutationVariables>(L.CycleCreateDocument, {
      input,
    });
    const data = response.cycleCreate;
    return new CyclePayload(this._request, data);
  }
}

/**
 * A fetchable CycleUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class CycleUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the CycleUpdate mutation and return a CyclePayload
   *
   * @param id - required id to pass to cycleUpdate
   * @param input - required input to pass to cycleUpdate
   * @returns parsed response from CycleUpdateMutation
   */
  public async fetch(id: string, input: L.CycleUpdateInput): LinearFetch<CyclePayload> {
    const response = await this._request<L.CycleUpdateMutation, L.CycleUpdateMutationVariables>(L.CycleUpdateDocument, {
      id,
      input,
    });
    const data = response.cycleUpdate;
    return new CyclePayload(this._request, data);
  }
}

/**
 * A fetchable DebugCreateOAuthApps Mutation
 *
 * @param request - function to call the graphql client
 */
export class DebugCreateOAuthAppsMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the DebugCreateOAuthApps mutation and return a DebugPayload
   *
   * @returns parsed response from DebugCreateOAuthAppsMutation
   */
  public async fetch(): LinearFetch<DebugPayload> {
    const response = await this._request<L.DebugCreateOAuthAppsMutation, L.DebugCreateOAuthAppsMutationVariables>(
      L.DebugCreateOAuthAppsDocument,
      {}
    );
    const data = response.debugCreateOAuthApps;
    return new DebugPayload(this._request, data);
  }
}

/**
 * A fetchable DebugCreateSamlOrg Mutation
 *
 * @param request - function to call the graphql client
 */
export class DebugCreateSamlOrgMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the DebugCreateSamlOrg mutation and return a DebugPayload
   *
   * @returns parsed response from DebugCreateSamlOrgMutation
   */
  public async fetch(): LinearFetch<DebugPayload> {
    const response = await this._request<L.DebugCreateSamlOrgMutation, L.DebugCreateSamlOrgMutationVariables>(
      L.DebugCreateSamlOrgDocument,
      {}
    );
    const data = response.debugCreateSAMLOrg;
    return new DebugPayload(this._request, data);
  }
}

/**
 * A fetchable DebugFailWithInternalError Mutation
 *
 * @param request - function to call the graphql client
 */
export class DebugFailWithInternalErrorMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the DebugFailWithInternalError mutation and return a DebugPayload
   *
   * @returns parsed response from DebugFailWithInternalErrorMutation
   */
  public async fetch(): LinearFetch<DebugPayload> {
    const response = await this._request<
      L.DebugFailWithInternalErrorMutation,
      L.DebugFailWithInternalErrorMutationVariables
    >(L.DebugFailWithInternalErrorDocument, {});
    const data = response.debugFailWithInternalError;
    return new DebugPayload(this._request, data);
  }
}

/**
 * A fetchable DebugFailWithWarning Mutation
 *
 * @param request - function to call the graphql client
 */
export class DebugFailWithWarningMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the DebugFailWithWarning mutation and return a DebugPayload
   *
   * @returns parsed response from DebugFailWithWarningMutation
   */
  public async fetch(): LinearFetch<DebugPayload> {
    const response = await this._request<L.DebugFailWithWarningMutation, L.DebugFailWithWarningMutationVariables>(
      L.DebugFailWithWarningDocument,
      {}
    );
    const data = response.debugFailWithWarning;
    return new DebugPayload(this._request, data);
  }
}

/**
 * A fetchable DocumentCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class DocumentCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the DocumentCreate mutation and return a DocumentPayload
   *
   * @param input - required input to pass to documentCreate
   * @returns parsed response from DocumentCreateMutation
   */
  public async fetch(input: L.DocumentCreateInput): LinearFetch<DocumentPayload> {
    const response = await this._request<L.DocumentCreateMutation, L.DocumentCreateMutationVariables>(
      L.DocumentCreateDocument,
      {
        input,
      }
    );
    const data = response.documentCreate;
    return new DocumentPayload(this._request, data);
  }
}

/**
 * A fetchable DocumentDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class DocumentDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the DocumentDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to documentDelete
   * @returns parsed response from DocumentDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.DocumentDeleteMutation, L.DocumentDeleteMutationVariables>(
      L.DocumentDeleteDocument,
      {
        id,
      }
    );
    const data = response.documentDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable DocumentUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class DocumentUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the DocumentUpdate mutation and return a DocumentPayload
   *
   * @param id - required id to pass to documentUpdate
   * @param input - required input to pass to documentUpdate
   * @returns parsed response from DocumentUpdateMutation
   */
  public async fetch(id: string, input: L.DocumentUpdateInput): LinearFetch<DocumentPayload> {
    const response = await this._request<L.DocumentUpdateMutation, L.DocumentUpdateMutationVariables>(
      L.DocumentUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.documentUpdate;
    return new DocumentPayload(this._request, data);
  }
}

/**
 * A fetchable EmailSubscribe Mutation
 *
 * @param request - function to call the graphql client
 */
export class EmailSubscribeMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the EmailSubscribe mutation and return a EmailSubscribePayload
   *
   * @param input - required input to pass to emailSubscribe
   * @returns parsed response from EmailSubscribeMutation
   */
  public async fetch(input: L.EmailSubscribeInput): LinearFetch<EmailSubscribePayload> {
    const response = await this._request<L.EmailSubscribeMutation, L.EmailSubscribeMutationVariables>(
      L.EmailSubscribeDocument,
      {
        input,
      }
    );
    const data = response.emailSubscribe;
    return new EmailSubscribePayload(this._request, data);
  }
}

/**
 * A fetchable EmailTokenUserAccountAuth Mutation
 *
 * @param request - function to call the graphql client
 */
export class EmailTokenUserAccountAuthMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the EmailTokenUserAccountAuth mutation and return a AuthResolverResponse
   *
   * @param input - required input to pass to emailTokenUserAccountAuth
   * @returns parsed response from EmailTokenUserAccountAuthMutation
   */
  public async fetch(input: L.TokenUserAccountAuthInput): LinearFetch<AuthResolverResponse> {
    const response = await this._request<
      L.EmailTokenUserAccountAuthMutation,
      L.EmailTokenUserAccountAuthMutationVariables
    >(L.EmailTokenUserAccountAuthDocument, {
      input,
    });
    const data = response.emailTokenUserAccountAuth;
    return new AuthResolverResponse(this._request, data);
  }
}

/**
 * A fetchable EmailUnsubscribe Mutation
 *
 * @param request - function to call the graphql client
 */
export class EmailUnsubscribeMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the EmailUnsubscribe mutation and return a EmailUnsubscribePayload
   *
   * @param input - required input to pass to emailUnsubscribe
   * @returns parsed response from EmailUnsubscribeMutation
   */
  public async fetch(input: L.EmailUnsubscribeInput): LinearFetch<EmailUnsubscribePayload> {
    const response = await this._request<L.EmailUnsubscribeMutation, L.EmailUnsubscribeMutationVariables>(
      L.EmailUnsubscribeDocument,
      {
        input,
      }
    );
    const data = response.emailUnsubscribe;
    return new EmailUnsubscribePayload(this._request, data);
  }
}

/**
 * A fetchable EmailUserAccountAuthChallenge Mutation
 *
 * @param request - function to call the graphql client
 */
export class EmailUserAccountAuthChallengeMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the EmailUserAccountAuthChallenge mutation and return a EmailUserAccountAuthChallengeResponse
   *
   * @param input - required input to pass to emailUserAccountAuthChallenge
   * @returns parsed response from EmailUserAccountAuthChallengeMutation
   */
  public async fetch(input: L.EmailUserAccountAuthChallengeInput): LinearFetch<EmailUserAccountAuthChallengeResponse> {
    const response = await this._request<
      L.EmailUserAccountAuthChallengeMutation,
      L.EmailUserAccountAuthChallengeMutationVariables
    >(L.EmailUserAccountAuthChallengeDocument, {
      input,
    });
    const data = response.emailUserAccountAuthChallenge;
    return new EmailUserAccountAuthChallengeResponse(this._request, data);
  }
}

/**
 * A fetchable EmojiCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class EmojiCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the EmojiCreate mutation and return a EmojiPayload
   *
   * @param input - required input to pass to emojiCreate
   * @returns parsed response from EmojiCreateMutation
   */
  public async fetch(input: L.EmojiCreateInput): LinearFetch<EmojiPayload> {
    const response = await this._request<L.EmojiCreateMutation, L.EmojiCreateMutationVariables>(L.EmojiCreateDocument, {
      input,
    });
    const data = response.emojiCreate;
    return new EmojiPayload(this._request, data);
  }
}

/**
 * A fetchable EmojiDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class EmojiDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the EmojiDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to emojiDelete
   * @returns parsed response from EmojiDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.EmojiDeleteMutation, L.EmojiDeleteMutationVariables>(L.EmojiDeleteDocument, {
      id,
    });
    const data = response.emojiDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable EventCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class EventCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the EventCreate mutation and return a EventPayload
   *
   * @param input - required input to pass to eventCreate
   * @returns parsed response from EventCreateMutation
   */
  public async fetch(input: L.EventCreateInput): LinearFetch<EventPayload> {
    const response = await this._request<L.EventCreateMutation, L.EventCreateMutationVariables>(L.EventCreateDocument, {
      input,
    });
    const data = response.eventCreate;
    return new EventPayload(this._request, data);
  }
}

/**
 * A fetchable FavoriteCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class FavoriteCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the FavoriteCreate mutation and return a FavoritePayload
   *
   * @param input - required input to pass to favoriteCreate
   * @returns parsed response from FavoriteCreateMutation
   */
  public async fetch(input: L.FavoriteCreateInput): LinearFetch<FavoritePayload> {
    const response = await this._request<L.FavoriteCreateMutation, L.FavoriteCreateMutationVariables>(
      L.FavoriteCreateDocument,
      {
        input,
      }
    );
    const data = response.favoriteCreate;
    return new FavoritePayload(this._request, data);
  }
}

/**
 * A fetchable FavoriteDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class FavoriteDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the FavoriteDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to favoriteDelete
   * @returns parsed response from FavoriteDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.FavoriteDeleteMutation, L.FavoriteDeleteMutationVariables>(
      L.FavoriteDeleteDocument,
      {
        id,
      }
    );
    const data = response.favoriteDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable FavoriteUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class FavoriteUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the FavoriteUpdate mutation and return a FavoritePayload
   *
   * @param id - required id to pass to favoriteUpdate
   * @param input - required input to pass to favoriteUpdate
   * @returns parsed response from FavoriteUpdateMutation
   */
  public async fetch(id: string, input: L.FavoriteUpdateInput): LinearFetch<FavoritePayload> {
    const response = await this._request<L.FavoriteUpdateMutation, L.FavoriteUpdateMutationVariables>(
      L.FavoriteUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.favoriteUpdate;
    return new FavoritePayload(this._request, data);
  }
}

/**
 * A fetchable FeedbackCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class FeedbackCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the FeedbackCreate mutation and return a FeedbackPayload
   *
   * @param input - required input to pass to feedbackCreate
   * @returns parsed response from FeedbackCreateMutation
   */
  public async fetch(input: L.FeedbackCreateInput): LinearFetch<FeedbackPayload> {
    const response = await this._request<L.FeedbackCreateMutation, L.FeedbackCreateMutationVariables>(
      L.FeedbackCreateDocument,
      {
        input,
      }
    );
    const data = response.feedbackCreate;
    return new FeedbackPayload(this._request, data);
  }
}

/**
 * A fetchable FileUpload Mutation
 *
 * @param request - function to call the graphql client
 */
export class FileUploadMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the FileUpload mutation and return a UploadPayload
   *
   * @param contentType - required contentType to pass to fileUpload
   * @param filename - required filename to pass to fileUpload
   * @param size - required size to pass to fileUpload
   * @param variables - variables without 'contentType', 'filename', 'size' to pass into the FileUploadMutation
   * @returns parsed response from FileUploadMutation
   */
  public async fetch(
    contentType: string,
    filename: string,
    size: number,
    variables?: Omit<L.FileUploadMutationVariables, "contentType" | "filename" | "size">
  ): LinearFetch<UploadPayload> {
    const response = await this._request<L.FileUploadMutation, L.FileUploadMutationVariables>(L.FileUploadDocument, {
      contentType,
      filename,
      size,
      ...variables,
    });
    const data = response.fileUpload;
    return new UploadPayload(this._request, data);
  }
}

/**
 * A fetchable GoogleUserAccountAuth Mutation
 *
 * @param request - function to call the graphql client
 */
export class GoogleUserAccountAuthMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the GoogleUserAccountAuth mutation and return a AuthResolverResponse
   *
   * @param input - required input to pass to googleUserAccountAuth
   * @returns parsed response from GoogleUserAccountAuthMutation
   */
  public async fetch(input: L.GoogleUserAccountAuthInput): LinearFetch<AuthResolverResponse> {
    const response = await this._request<L.GoogleUserAccountAuthMutation, L.GoogleUserAccountAuthMutationVariables>(
      L.GoogleUserAccountAuthDocument,
      {
        input,
      }
    );
    const data = response.googleUserAccountAuth;
    return new AuthResolverResponse(this._request, data);
  }
}

/**
 * A fetchable ImageUploadFromUrl Mutation
 *
 * @param request - function to call the graphql client
 */
export class ImageUploadFromUrlMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ImageUploadFromUrl mutation and return a ImageUploadFromUrlPayload
   *
   * @param url - required url to pass to imageUploadFromUrl
   * @returns parsed response from ImageUploadFromUrlMutation
   */
  public async fetch(url: string): LinearFetch<ImageUploadFromUrlPayload> {
    const response = await this._request<L.ImageUploadFromUrlMutation, L.ImageUploadFromUrlMutationVariables>(
      L.ImageUploadFromUrlDocument,
      {
        url,
      }
    );
    const data = response.imageUploadFromUrl;
    return new ImageUploadFromUrlPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to integrationDelete
   * @returns parsed response from IntegrationDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.IntegrationDeleteMutation, L.IntegrationDeleteMutationVariables>(
      L.IntegrationDeleteDocument,
      {
        id,
      }
    );
    const data = response.integrationDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationFigma Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationFigmaMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationFigma mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationFigma
   * @param redirectUri - required redirectUri to pass to integrationFigma
   * @returns parsed response from IntegrationFigmaMutation
   */
  public async fetch(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationFigmaMutation, L.IntegrationFigmaMutationVariables>(
      L.IntegrationFigmaDocument,
      {
        code,
        redirectUri,
      }
    );
    const data = response.integrationFigma;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationFront Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationFrontMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationFront mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationFront
   * @param redirectUri - required redirectUri to pass to integrationFront
   * @returns parsed response from IntegrationFrontMutation
   */
  public async fetch(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationFrontMutation, L.IntegrationFrontMutationVariables>(
      L.IntegrationFrontDocument,
      {
        code,
        redirectUri,
      }
    );
    const data = response.integrationFront;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationGithubConnect Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationGithubConnectMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationGithubConnect mutation and return a IntegrationPayload
   *
   * @param installationId - required installationId to pass to integrationGithubConnect
   * @returns parsed response from IntegrationGithubConnectMutation
   */
  public async fetch(installationId: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationGithubConnectMutation,
      L.IntegrationGithubConnectMutationVariables
    >(L.IntegrationGithubConnectDocument, {
      installationId,
    });
    const data = response.integrationGithubConnect;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationGitlabConnect Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationGitlabConnectMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationGitlabConnect mutation and return a IntegrationPayload
   *
   * @param accessToken - required accessToken to pass to integrationGitlabConnect
   * @param gitlabUrl - required gitlabUrl to pass to integrationGitlabConnect
   * @returns parsed response from IntegrationGitlabConnectMutation
   */
  public async fetch(accessToken: string, gitlabUrl: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationGitlabConnectMutation,
      L.IntegrationGitlabConnectMutationVariables
    >(L.IntegrationGitlabConnectDocument, {
      accessToken,
      gitlabUrl,
    });
    const data = response.integrationGitlabConnect;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationGoogleSheets Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationGoogleSheetsMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationGoogleSheets mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationGoogleSheets
   * @returns parsed response from IntegrationGoogleSheetsMutation
   */
  public async fetch(code: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationGoogleSheetsMutation, L.IntegrationGoogleSheetsMutationVariables>(
      L.IntegrationGoogleSheetsDocument,
      {
        code,
      }
    );
    const data = response.integrationGoogleSheets;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationIntercom Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationIntercomMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationIntercom mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationIntercom
   * @param redirectUri - required redirectUri to pass to integrationIntercom
   * @returns parsed response from IntegrationIntercomMutation
   */
  public async fetch(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationIntercomMutation, L.IntegrationIntercomMutationVariables>(
      L.IntegrationIntercomDocument,
      {
        code,
        redirectUri,
      }
    );
    const data = response.integrationIntercom;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationIntercomDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationIntercomDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationIntercomDelete mutation and return a IntegrationPayload
   *
   * @returns parsed response from IntegrationIntercomDeleteMutation
   */
  public async fetch(): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationIntercomDeleteMutation,
      L.IntegrationIntercomDeleteMutationVariables
    >(L.IntegrationIntercomDeleteDocument, {});
    const data = response.integrationIntercomDelete;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationIntercomSettingsUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationIntercomSettingsUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationIntercomSettingsUpdate mutation and return a IntegrationPayload
   *
   * @param input - required input to pass to integrationIntercomSettingsUpdate
   * @returns parsed response from IntegrationIntercomSettingsUpdateMutation
   */
  public async fetch(input: L.IntercomSettingsInput): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationIntercomSettingsUpdateMutation,
      L.IntegrationIntercomSettingsUpdateMutationVariables
    >(L.IntegrationIntercomSettingsUpdateDocument, {
      input,
    });
    const data = response.integrationIntercomSettingsUpdate;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationJiraSettingsUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationJiraSettingsUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationJiraSettingsUpdate mutation and return a IntegrationPayload
   *
   * @param input - required input to pass to integrationJiraSettingsUpdate
   * @returns parsed response from IntegrationJiraSettingsUpdateMutation
   */
  public async fetch(input: L.JiraSettingsInput): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationJiraSettingsUpdateMutation,
      L.IntegrationJiraSettingsUpdateMutationVariables
    >(L.IntegrationJiraSettingsUpdateDocument, {
      input,
    });
    const data = response.integrationJiraSettingsUpdate;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationLoom Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationLoomMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationLoom mutation and return a IntegrationPayload
   *
   * @returns parsed response from IntegrationLoomMutation
   */
  public async fetch(): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationLoomMutation, L.IntegrationLoomMutationVariables>(
      L.IntegrationLoomDocument,
      {}
    );
    const data = response.integrationLoom;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationResourceArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationResourceArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationResourceArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to integrationResourceArchive
   * @returns parsed response from IntegrationResourceArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<
      L.IntegrationResourceArchiveMutation,
      L.IntegrationResourceArchiveMutationVariables
    >(L.IntegrationResourceArchiveDocument, {
      id,
    });
    const data = response.integrationResourceArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationSentryConnect Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationSentryConnectMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationSentryConnect mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationSentryConnect
   * @param installationId - required installationId to pass to integrationSentryConnect
   * @param organizationSlug - required organizationSlug to pass to integrationSentryConnect
   * @returns parsed response from IntegrationSentryConnectMutation
   */
  public async fetch(code: string, installationId: string, organizationSlug: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationSentryConnectMutation,
      L.IntegrationSentryConnectMutationVariables
    >(L.IntegrationSentryConnectDocument, {
      code,
      installationId,
      organizationSlug,
    });
    const data = response.integrationSentryConnect;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationSlack Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationSlackMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationSlack mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationSlack
   * @param redirectUri - required redirectUri to pass to integrationSlack
   * @param variables - variables without 'code', 'redirectUri' to pass into the IntegrationSlackMutation
   * @returns parsed response from IntegrationSlackMutation
   */
  public async fetch(
    code: string,
    redirectUri: string,
    variables?: Omit<L.IntegrationSlackMutationVariables, "code" | "redirectUri">
  ): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationSlackMutation, L.IntegrationSlackMutationVariables>(
      L.IntegrationSlackDocument,
      {
        code,
        redirectUri,
        ...variables,
      }
    );
    const data = response.integrationSlack;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationSlackImportEmojis Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationSlackImportEmojisMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationSlackImportEmojis mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationSlackImportEmojis
   * @param redirectUri - required redirectUri to pass to integrationSlackImportEmojis
   * @returns parsed response from IntegrationSlackImportEmojisMutation
   */
  public async fetch(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationSlackImportEmojisMutation,
      L.IntegrationSlackImportEmojisMutationVariables
    >(L.IntegrationSlackImportEmojisDocument, {
      code,
      redirectUri,
    });
    const data = response.integrationSlackImportEmojis;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationSlackPersonal Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationSlackPersonalMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationSlackPersonal mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationSlackPersonal
   * @param redirectUri - required redirectUri to pass to integrationSlackPersonal
   * @returns parsed response from IntegrationSlackPersonalMutation
   */
  public async fetch(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationSlackPersonalMutation,
      L.IntegrationSlackPersonalMutationVariables
    >(L.IntegrationSlackPersonalDocument, {
      code,
      redirectUri,
    });
    const data = response.integrationSlackPersonal;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationSlackPost Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationSlackPostMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationSlackPost mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationSlackPost
   * @param redirectUri - required redirectUri to pass to integrationSlackPost
   * @param teamId - required teamId to pass to integrationSlackPost
   * @param variables - variables without 'code', 'redirectUri', 'teamId' to pass into the IntegrationSlackPostMutation
   * @returns parsed response from IntegrationSlackPostMutation
   */
  public async fetch(
    code: string,
    redirectUri: string,
    teamId: string,
    variables?: Omit<L.IntegrationSlackPostMutationVariables, "code" | "redirectUri" | "teamId">
  ): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationSlackPostMutation, L.IntegrationSlackPostMutationVariables>(
      L.IntegrationSlackPostDocument,
      {
        code,
        redirectUri,
        teamId,
        ...variables,
      }
    );
    const data = response.integrationSlackPost;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationSlackProjectPost Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationSlackProjectPostMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationSlackProjectPost mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationSlackProjectPost
   * @param projectId - required projectId to pass to integrationSlackProjectPost
   * @param redirectUri - required redirectUri to pass to integrationSlackProjectPost
   * @returns parsed response from IntegrationSlackProjectPostMutation
   */
  public async fetch(code: string, projectId: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<
      L.IntegrationSlackProjectPostMutation,
      L.IntegrationSlackProjectPostMutationVariables
    >(L.IntegrationSlackProjectPostDocument, {
      code,
      projectId,
      redirectUri,
    });
    const data = response.integrationSlackProjectPost;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IntegrationZendesk Mutation
 *
 * @param request - function to call the graphql client
 */
export class IntegrationZendeskMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IntegrationZendesk mutation and return a IntegrationPayload
   *
   * @param code - required code to pass to integrationZendesk
   * @param redirectUri - required redirectUri to pass to integrationZendesk
   * @param scope - required scope to pass to integrationZendesk
   * @param subdomain - required subdomain to pass to integrationZendesk
   * @returns parsed response from IntegrationZendeskMutation
   */
  public async fetch(
    code: string,
    redirectUri: string,
    scope: string,
    subdomain: string
  ): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.IntegrationZendeskMutation, L.IntegrationZendeskMutationVariables>(
      L.IntegrationZendeskDocument,
      {
        code,
        redirectUri,
        scope,
        subdomain,
      }
    );
    const data = response.integrationZendesk;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable IssueArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to issueArchive
   * @param variables - variables without 'id' to pass into the IssueArchiveMutation
   * @returns parsed response from IssueArchiveMutation
   */
  public async fetch(id: string, variables?: Omit<L.IssueArchiveMutationVariables, "id">): LinearFetch<ArchivePayload> {
    const response = await this._request<L.IssueArchiveMutation, L.IssueArchiveMutationVariables>(
      L.IssueArchiveDocument,
      {
        id,
        ...variables,
      }
    );
    const data = response.issueArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable IssueBatchUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueBatchUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueBatchUpdate mutation and return a IssueBatchPayload
   *
   * @param ids - required ids to pass to issueBatchUpdate
   * @param input - required input to pass to issueBatchUpdate
   * @returns parsed response from IssueBatchUpdateMutation
   */
  public async fetch(ids: L.Scalars["UUID"][], input: L.IssueUpdateInput): LinearFetch<IssueBatchPayload> {
    const response = await this._request<L.IssueBatchUpdateMutation, L.IssueBatchUpdateMutationVariables>(
      L.IssueBatchUpdateDocument,
      {
        ids,
        input,
      }
    );
    const data = response.issueBatchUpdate;
    return new IssueBatchPayload(this._request, data);
  }
}

/**
 * A fetchable IssueCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueCreate mutation and return a IssuePayload
   *
   * @param input - required input to pass to issueCreate
   * @returns parsed response from IssueCreateMutation
   */
  public async fetch(input: L.IssueCreateInput): LinearFetch<IssuePayload> {
    const response = await this._request<L.IssueCreateMutation, L.IssueCreateMutationVariables>(L.IssueCreateDocument, {
      input,
    });
    const data = response.issueCreate;
    return new IssuePayload(this._request, data);
  }
}

/**
 * A fetchable IssueDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to issueDelete
   * @returns parsed response from IssueDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.IssueDeleteMutation, L.IssueDeleteMutationVariables>(L.IssueDeleteDocument, {
      id,
    });
    const data = response.issueDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable IssueImportCreateAsana Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueImportCreateAsanaMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportCreateAsana mutation and return a IssueImportPayload
   *
   * @param asanaTeamName - required asanaTeamName to pass to issueImportCreateAsana
   * @param asanaToken - required asanaToken to pass to issueImportCreateAsana
   * @param teamId - required teamId to pass to issueImportCreateAsana
   * @param variables - variables without 'asanaTeamName', 'asanaToken', 'teamId' to pass into the IssueImportCreateAsanaMutation
   * @returns parsed response from IssueImportCreateAsanaMutation
   */
  public async fetch(
    asanaTeamName: string,
    asanaToken: string,
    teamId: string,
    variables?: Omit<L.IssueImportCreateAsanaMutationVariables, "asanaTeamName" | "asanaToken" | "teamId">
  ): LinearFetch<IssueImportPayload> {
    const response = await this._request<L.IssueImportCreateAsanaMutation, L.IssueImportCreateAsanaMutationVariables>(
      L.IssueImportCreateAsanaDocument,
      {
        asanaTeamName,
        asanaToken,
        teamId,
        ...variables,
      }
    );
    const data = response.issueImportCreateAsana;
    return new IssueImportPayload(this._request, data);
  }
}

/**
 * A fetchable IssueImportCreateClubhouse Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueImportCreateClubhouseMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportCreateClubhouse mutation and return a IssueImportPayload
   *
   * @param clubhouseTeamName - required clubhouseTeamName to pass to issueImportCreateClubhouse
   * @param clubhouseToken - required clubhouseToken to pass to issueImportCreateClubhouse
   * @param teamId - required teamId to pass to issueImportCreateClubhouse
   * @param variables - variables without 'clubhouseTeamName', 'clubhouseToken', 'teamId' to pass into the IssueImportCreateClubhouseMutation
   * @returns parsed response from IssueImportCreateClubhouseMutation
   */
  public async fetch(
    clubhouseTeamName: string,
    clubhouseToken: string,
    teamId: string,
    variables?: Omit<L.IssueImportCreateClubhouseMutationVariables, "clubhouseTeamName" | "clubhouseToken" | "teamId">
  ): LinearFetch<IssueImportPayload> {
    const response = await this._request<
      L.IssueImportCreateClubhouseMutation,
      L.IssueImportCreateClubhouseMutationVariables
    >(L.IssueImportCreateClubhouseDocument, {
      clubhouseTeamName,
      clubhouseToken,
      teamId,
      ...variables,
    });
    const data = response.issueImportCreateClubhouse;
    return new IssueImportPayload(this._request, data);
  }
}

/**
 * A fetchable IssueImportCreateGithub Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueImportCreateGithubMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportCreateGithub mutation and return a IssueImportPayload
   *
   * @param githubRepoName - required githubRepoName to pass to issueImportCreateGithub
   * @param githubRepoOwner - required githubRepoOwner to pass to issueImportCreateGithub
   * @param githubToken - required githubToken to pass to issueImportCreateGithub
   * @param teamId - required teamId to pass to issueImportCreateGithub
   * @param variables - variables without 'githubRepoName', 'githubRepoOwner', 'githubToken', 'teamId' to pass into the IssueImportCreateGithubMutation
   * @returns parsed response from IssueImportCreateGithubMutation
   */
  public async fetch(
    githubRepoName: string,
    githubRepoOwner: string,
    githubToken: string,
    teamId: string,
    variables?: Omit<
      L.IssueImportCreateGithubMutationVariables,
      "githubRepoName" | "githubRepoOwner" | "githubToken" | "teamId"
    >
  ): LinearFetch<IssueImportPayload> {
    const response = await this._request<L.IssueImportCreateGithubMutation, L.IssueImportCreateGithubMutationVariables>(
      L.IssueImportCreateGithubDocument,
      {
        githubRepoName,
        githubRepoOwner,
        githubToken,
        teamId,
        ...variables,
      }
    );
    const data = response.issueImportCreateGithub;
    return new IssueImportPayload(this._request, data);
  }
}

/**
 * A fetchable IssueImportCreateJira Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueImportCreateJiraMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportCreateJira mutation and return a IssueImportPayload
   *
   * @param jiraEmail - required jiraEmail to pass to issueImportCreateJira
   * @param jiraHostname - required jiraHostname to pass to issueImportCreateJira
   * @param jiraProject - required jiraProject to pass to issueImportCreateJira
   * @param jiraToken - required jiraToken to pass to issueImportCreateJira
   * @param teamId - required teamId to pass to issueImportCreateJira
   * @param variables - variables without 'jiraEmail', 'jiraHostname', 'jiraProject', 'jiraToken', 'teamId' to pass into the IssueImportCreateJiraMutation
   * @returns parsed response from IssueImportCreateJiraMutation
   */
  public async fetch(
    jiraEmail: string,
    jiraHostname: string,
    jiraProject: string,
    jiraToken: string,
    teamId: string,
    variables?: Omit<
      L.IssueImportCreateJiraMutationVariables,
      "jiraEmail" | "jiraHostname" | "jiraProject" | "jiraToken" | "teamId"
    >
  ): LinearFetch<IssueImportPayload> {
    const response = await this._request<L.IssueImportCreateJiraMutation, L.IssueImportCreateJiraMutationVariables>(
      L.IssueImportCreateJiraDocument,
      {
        jiraEmail,
        jiraHostname,
        jiraProject,
        jiraToken,
        teamId,
        ...variables,
      }
    );
    const data = response.issueImportCreateJira;
    return new IssueImportPayload(this._request, data);
  }
}

/**
 * A fetchable IssueImportDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueImportDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportDelete mutation and return a IssueImportDeletePayload
   *
   * @param issueImportId - required issueImportId to pass to issueImportDelete
   * @returns parsed response from IssueImportDeleteMutation
   */
  public async fetch(issueImportId: string): LinearFetch<IssueImportDeletePayload> {
    const response = await this._request<L.IssueImportDeleteMutation, L.IssueImportDeleteMutationVariables>(
      L.IssueImportDeleteDocument,
      {
        issueImportId,
      }
    );
    const data = response.issueImportDelete;
    return new IssueImportDeletePayload(this._request, data);
  }
}

/**
 * A fetchable IssueImportProcess Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueImportProcessMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportProcess mutation and return a IssueImportPayload
   *
   * @param issueImportId - required issueImportId to pass to issueImportProcess
   * @param mapping - required mapping to pass to issueImportProcess
   * @returns parsed response from IssueImportProcessMutation
   */
  public async fetch(issueImportId: string, mapping: Record<string, unknown>): LinearFetch<IssueImportPayload> {
    const response = await this._request<L.IssueImportProcessMutation, L.IssueImportProcessMutationVariables>(
      L.IssueImportProcessDocument,
      {
        issueImportId,
        mapping,
      }
    );
    const data = response.issueImportProcess;
    return new IssueImportPayload(this._request, data);
  }
}

/**
 * A fetchable IssueImportUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueImportUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueImportUpdate mutation and return a IssueImportPayload
   *
   * @param id - required id to pass to issueImportUpdate
   * @param input - required input to pass to issueImportUpdate
   * @returns parsed response from IssueImportUpdateMutation
   */
  public async fetch(id: string, input: L.IssueImportUpdateInput): LinearFetch<IssueImportPayload> {
    const response = await this._request<L.IssueImportUpdateMutation, L.IssueImportUpdateMutationVariables>(
      L.IssueImportUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.issueImportUpdate;
    return new IssueImportPayload(this._request, data);
  }
}

/**
 * A fetchable IssueLabelArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueLabelArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueLabelArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to issueLabelArchive
   * @returns parsed response from IssueLabelArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.IssueLabelArchiveMutation, L.IssueLabelArchiveMutationVariables>(
      L.IssueLabelArchiveDocument,
      {
        id,
      }
    );
    const data = response.issueLabelArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable IssueLabelCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueLabelCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueLabelCreate mutation and return a IssueLabelPayload
   *
   * @param input - required input to pass to issueLabelCreate
   * @returns parsed response from IssueLabelCreateMutation
   */
  public async fetch(input: L.IssueLabelCreateInput): LinearFetch<IssueLabelPayload> {
    const response = await this._request<L.IssueLabelCreateMutation, L.IssueLabelCreateMutationVariables>(
      L.IssueLabelCreateDocument,
      {
        input,
      }
    );
    const data = response.issueLabelCreate;
    return new IssueLabelPayload(this._request, data);
  }
}

/**
 * A fetchable IssueLabelUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueLabelUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueLabelUpdate mutation and return a IssueLabelPayload
   *
   * @param id - required id to pass to issueLabelUpdate
   * @param input - required input to pass to issueLabelUpdate
   * @returns parsed response from IssueLabelUpdateMutation
   */
  public async fetch(id: string, input: L.IssueLabelUpdateInput): LinearFetch<IssueLabelPayload> {
    const response = await this._request<L.IssueLabelUpdateMutation, L.IssueLabelUpdateMutationVariables>(
      L.IssueLabelUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.issueLabelUpdate;
    return new IssueLabelPayload(this._request, data);
  }
}

/**
 * A fetchable IssueRelationCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueRelationCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueRelationCreate mutation and return a IssueRelationPayload
   *
   * @param input - required input to pass to issueRelationCreate
   * @returns parsed response from IssueRelationCreateMutation
   */
  public async fetch(input: L.IssueRelationCreateInput): LinearFetch<IssueRelationPayload> {
    const response = await this._request<L.IssueRelationCreateMutation, L.IssueRelationCreateMutationVariables>(
      L.IssueRelationCreateDocument,
      {
        input,
      }
    );
    const data = response.issueRelationCreate;
    return new IssueRelationPayload(this._request, data);
  }
}

/**
 * A fetchable IssueRelationDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueRelationDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueRelationDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to issueRelationDelete
   * @returns parsed response from IssueRelationDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.IssueRelationDeleteMutation, L.IssueRelationDeleteMutationVariables>(
      L.IssueRelationDeleteDocument,
      {
        id,
      }
    );
    const data = response.issueRelationDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable IssueRelationUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueRelationUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueRelationUpdate mutation and return a IssueRelationPayload
   *
   * @param id - required id to pass to issueRelationUpdate
   * @param input - required input to pass to issueRelationUpdate
   * @returns parsed response from IssueRelationUpdateMutation
   */
  public async fetch(id: string, input: L.IssueRelationUpdateInput): LinearFetch<IssueRelationPayload> {
    const response = await this._request<L.IssueRelationUpdateMutation, L.IssueRelationUpdateMutationVariables>(
      L.IssueRelationUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.issueRelationUpdate;
    return new IssueRelationPayload(this._request, data);
  }
}

/**
 * A fetchable IssueUnarchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueUnarchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueUnarchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to issueUnarchive
   * @returns parsed response from IssueUnarchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.IssueUnarchiveMutation, L.IssueUnarchiveMutationVariables>(
      L.IssueUnarchiveDocument,
      {
        id,
      }
    );
    const data = response.issueUnarchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable IssueUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class IssueUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the IssueUpdate mutation and return a IssuePayload
   *
   * @param id - required id to pass to issueUpdate
   * @param input - required input to pass to issueUpdate
   * @returns parsed response from IssueUpdateMutation
   */
  public async fetch(id: string, input: L.IssueUpdateInput): LinearFetch<IssuePayload> {
    const response = await this._request<L.IssueUpdateMutation, L.IssueUpdateMutationVariables>(L.IssueUpdateDocument, {
      id,
      input,
    });
    const data = response.issueUpdate;
    return new IssuePayload(this._request, data);
  }
}

/**
 * A fetchable JiraIntegrationConnect Mutation
 *
 * @param request - function to call the graphql client
 */
export class JiraIntegrationConnectMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the JiraIntegrationConnect mutation and return a IntegrationPayload
   *
   * @param input - required input to pass to jiraIntegrationConnect
   * @returns parsed response from JiraIntegrationConnectMutation
   */
  public async fetch(input: L.JiraConfigurationInput): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.JiraIntegrationConnectMutation, L.JiraIntegrationConnectMutationVariables>(
      L.JiraIntegrationConnectDocument,
      {
        input,
      }
    );
    const data = response.jiraIntegrationConnect;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable JoinOrganizationFromOnboarding Mutation
 *
 * @param request - function to call the graphql client
 */
export class JoinOrganizationFromOnboardingMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the JoinOrganizationFromOnboarding mutation and return a CreateOrJoinOrganizationResponse
   *
   * @param input - required input to pass to joinOrganizationFromOnboarding
   * @returns parsed response from JoinOrganizationFromOnboardingMutation
   */
  public async fetch(input: L.JoinOrganizationInput): LinearFetch<CreateOrJoinOrganizationResponse> {
    const response = await this._request<
      L.JoinOrganizationFromOnboardingMutation,
      L.JoinOrganizationFromOnboardingMutationVariables
    >(L.JoinOrganizationFromOnboardingDocument, {
      input,
    });
    const data = response.joinOrganizationFromOnboarding;
    return new CreateOrJoinOrganizationResponse(this._request, data);
  }
}

/**
 * A fetchable LeaveOrganization Mutation
 *
 * @param request - function to call the graphql client
 */
export class LeaveOrganizationMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the LeaveOrganization mutation and return a CreateOrJoinOrganizationResponse
   *
   * @param organizationId - required organizationId to pass to leaveOrganization
   * @returns parsed response from LeaveOrganizationMutation
   */
  public async fetch(organizationId: string): LinearFetch<CreateOrJoinOrganizationResponse> {
    const response = await this._request<L.LeaveOrganizationMutation, L.LeaveOrganizationMutationVariables>(
      L.LeaveOrganizationDocument,
      {
        organizationId,
      }
    );
    const data = response.leaveOrganization;
    return new CreateOrJoinOrganizationResponse(this._request, data);
  }
}

/**
 * A fetchable MilestoneCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class MilestoneCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the MilestoneCreate mutation and return a MilestonePayload
   *
   * @param input - required input to pass to milestoneCreate
   * @returns parsed response from MilestoneCreateMutation
   */
  public async fetch(input: L.MilestoneCreateInput): LinearFetch<MilestonePayload> {
    const response = await this._request<L.MilestoneCreateMutation, L.MilestoneCreateMutationVariables>(
      L.MilestoneCreateDocument,
      {
        input,
      }
    );
    const data = response.milestoneCreate;
    return new MilestonePayload(this._request, data);
  }
}

/**
 * A fetchable MilestoneDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class MilestoneDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the MilestoneDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to milestoneDelete
   * @returns parsed response from MilestoneDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.MilestoneDeleteMutation, L.MilestoneDeleteMutationVariables>(
      L.MilestoneDeleteDocument,
      {
        id,
      }
    );
    const data = response.milestoneDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable MilestoneUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class MilestoneUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the MilestoneUpdate mutation and return a MilestonePayload
   *
   * @param id - required id to pass to milestoneUpdate
   * @param input - required input to pass to milestoneUpdate
   * @returns parsed response from MilestoneUpdateMutation
   */
  public async fetch(id: string, input: L.MilestoneUpdateInput): LinearFetch<MilestonePayload> {
    const response = await this._request<L.MilestoneUpdateMutation, L.MilestoneUpdateMutationVariables>(
      L.MilestoneUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.milestoneUpdate;
    return new MilestonePayload(this._request, data);
  }
}

/**
 * A fetchable NotificationArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class NotificationArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to notificationArchive
   * @returns parsed response from NotificationArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.NotificationArchiveMutation, L.NotificationArchiveMutationVariables>(
      L.NotificationArchiveDocument,
      {
        id,
      }
    );
    const data = response.notificationArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable NotificationCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class NotificationCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationCreate mutation and return a NotificationPayload
   *
   * @param id - required id to pass to notificationCreate
   * @param input - required input to pass to notificationCreate
   * @returns parsed response from NotificationCreateMutation
   */
  public async fetch(id: string, input: L.NotificationUpdateInput): LinearFetch<NotificationPayload> {
    const response = await this._request<L.NotificationCreateMutation, L.NotificationCreateMutationVariables>(
      L.NotificationCreateDocument,
      {
        id,
        input,
      }
    );
    const data = response.notificationCreate;
    return new NotificationPayload(this._request, data);
  }
}

/**
 * A fetchable NotificationSubscriptionCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class NotificationSubscriptionCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationSubscriptionCreate mutation and return a NotificationSubscriptionPayload
   *
   * @param input - required input to pass to notificationSubscriptionCreate
   * @returns parsed response from NotificationSubscriptionCreateMutation
   */
  public async fetch(input: L.NotificationSubscriptionCreateInput): LinearFetch<NotificationSubscriptionPayload> {
    const response = await this._request<
      L.NotificationSubscriptionCreateMutation,
      L.NotificationSubscriptionCreateMutationVariables
    >(L.NotificationSubscriptionCreateDocument, {
      input,
    });
    const data = response.notificationSubscriptionCreate;
    return new NotificationSubscriptionPayload(this._request, data);
  }
}

/**
 * A fetchable NotificationSubscriptionDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class NotificationSubscriptionDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationSubscriptionDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to notificationSubscriptionDelete
   * @returns parsed response from NotificationSubscriptionDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<
      L.NotificationSubscriptionDeleteMutation,
      L.NotificationSubscriptionDeleteMutationVariables
    >(L.NotificationSubscriptionDeleteDocument, {
      id,
    });
    const data = response.notificationSubscriptionDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable NotificationUnarchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class NotificationUnarchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationUnarchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to notificationUnarchive
   * @returns parsed response from NotificationUnarchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.NotificationUnarchiveMutation, L.NotificationUnarchiveMutationVariables>(
      L.NotificationUnarchiveDocument,
      {
        id,
      }
    );
    const data = response.notificationUnarchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable NotificationUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class NotificationUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the NotificationUpdate mutation and return a NotificationPayload
   *
   * @param id - required id to pass to notificationUpdate
   * @param input - required input to pass to notificationUpdate
   * @returns parsed response from NotificationUpdateMutation
   */
  public async fetch(id: string, input: L.NotificationUpdateInput): LinearFetch<NotificationPayload> {
    const response = await this._request<L.NotificationUpdateMutation, L.NotificationUpdateMutationVariables>(
      L.NotificationUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.notificationUpdate;
    return new NotificationPayload(this._request, data);
  }
}

/**
 * A fetchable OauthClientArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class OauthClientArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OauthClientArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to oauthClientArchive
   * @returns parsed response from OauthClientArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.OauthClientArchiveMutation, L.OauthClientArchiveMutationVariables>(
      L.OauthClientArchiveDocument,
      {
        id,
      }
    );
    const data = response.oauthClientArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable OauthClientCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class OauthClientCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OauthClientCreate mutation and return a OauthClientPayload
   *
   * @param input - required input to pass to oauthClientCreate
   * @returns parsed response from OauthClientCreateMutation
   */
  public async fetch(input: L.OauthClientCreateInput): LinearFetch<OauthClientPayload> {
    const response = await this._request<L.OauthClientCreateMutation, L.OauthClientCreateMutationVariables>(
      L.OauthClientCreateDocument,
      {
        input,
      }
    );
    const data = response.oauthClientCreate;
    return new OauthClientPayload(this._request, data);
  }
}

/**
 * A fetchable OauthClientRotateSecret Mutation
 *
 * @param request - function to call the graphql client
 */
export class OauthClientRotateSecretMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OauthClientRotateSecret mutation and return a RotateSecretPayload
   *
   * @param id - required id to pass to oauthClientRotateSecret
   * @returns parsed response from OauthClientRotateSecretMutation
   */
  public async fetch(id: string): LinearFetch<RotateSecretPayload> {
    const response = await this._request<L.OauthClientRotateSecretMutation, L.OauthClientRotateSecretMutationVariables>(
      L.OauthClientRotateSecretDocument,
      {
        id,
      }
    );
    const data = response.oauthClientRotateSecret;
    return new RotateSecretPayload(this._request, data);
  }
}

/**
 * A fetchable OauthClientUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class OauthClientUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OauthClientUpdate mutation and return a OauthClientPayload
   *
   * @param id - required id to pass to oauthClientUpdate
   * @param input - required input to pass to oauthClientUpdate
   * @returns parsed response from OauthClientUpdateMutation
   */
  public async fetch(id: string, input: L.OauthClientUpdateInput): LinearFetch<OauthClientPayload> {
    const response = await this._request<L.OauthClientUpdateMutation, L.OauthClientUpdateMutationVariables>(
      L.OauthClientUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.oauthClientUpdate;
    return new OauthClientPayload(this._request, data);
  }
}

/**
 * A fetchable OauthTokenRevoke Mutation
 *
 * @param request - function to call the graphql client
 */
export class OauthTokenRevokeMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OauthTokenRevoke mutation and return a OauthTokenRevokePayload
   *
   * @param appId - required appId to pass to oauthTokenRevoke
   * @param scope - required scope to pass to oauthTokenRevoke
   * @returns parsed response from OauthTokenRevokeMutation
   */
  public async fetch(appId: string, scope: string[]): LinearFetch<OauthTokenRevokePayload> {
    const response = await this._request<L.OauthTokenRevokeMutation, L.OauthTokenRevokeMutationVariables>(
      L.OauthTokenRevokeDocument,
      {
        appId,
        scope,
      }
    );
    const data = response.oauthTokenRevoke;
    return new OauthTokenRevokePayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationCancelDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationCancelDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationCancelDelete mutation and return a OrganizationCancelDeletePayload
   *
   * @returns parsed response from OrganizationCancelDeleteMutation
   */
  public async fetch(): LinearFetch<OrganizationCancelDeletePayload> {
    const response = await this._request<
      L.OrganizationCancelDeleteMutation,
      L.OrganizationCancelDeleteMutationVariables
    >(L.OrganizationCancelDeleteDocument, {});
    const data = response.organizationCancelDelete;
    return new OrganizationCancelDeletePayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationDelete mutation and return a OrganizationDeletePayload
   *
   * @param input - required input to pass to organizationDelete
   * @returns parsed response from OrganizationDeleteMutation
   */
  public async fetch(input: L.DeleteOrganizationInput): LinearFetch<OrganizationDeletePayload> {
    const response = await this._request<L.OrganizationDeleteMutation, L.OrganizationDeleteMutationVariables>(
      L.OrganizationDeleteDocument,
      {
        input,
      }
    );
    const data = response.organizationDelete;
    return new OrganizationDeletePayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationDeleteChallenge Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationDeleteChallengeMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationDeleteChallenge mutation and return a OrganizationDeletePayload
   *
   * @returns parsed response from OrganizationDeleteChallengeMutation
   */
  public async fetch(): LinearFetch<OrganizationDeletePayload> {
    const response = await this._request<
      L.OrganizationDeleteChallengeMutation,
      L.OrganizationDeleteChallengeMutationVariables
    >(L.OrganizationDeleteChallengeDocument, {});
    const data = response.organizationDeleteChallenge;
    return new OrganizationDeletePayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationDomainCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationDomainCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationDomainCreate mutation and return a OrganizationDomainPayload
   *
   * @param input - required input to pass to organizationDomainCreate
   * @returns parsed response from OrganizationDomainCreateMutation
   */
  public async fetch(input: L.OrganizationDomainCreateInput): LinearFetch<OrganizationDomainPayload> {
    const response = await this._request<
      L.OrganizationDomainCreateMutation,
      L.OrganizationDomainCreateMutationVariables
    >(L.OrganizationDomainCreateDocument, {
      input,
    });
    const data = response.organizationDomainCreate;
    return new OrganizationDomainPayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationDomainDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationDomainDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationDomainDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to organizationDomainDelete
   * @returns parsed response from OrganizationDomainDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<
      L.OrganizationDomainDeleteMutation,
      L.OrganizationDomainDeleteMutationVariables
    >(L.OrganizationDomainDeleteDocument, {
      id,
    });
    const data = response.organizationDomainDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationDomainVerify Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationDomainVerifyMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationDomainVerify mutation and return a OrganizationDomainPayload
   *
   * @param input - required input to pass to organizationDomainVerify
   * @returns parsed response from OrganizationDomainVerifyMutation
   */
  public async fetch(input: L.OrganizationDomainVerificationInput): LinearFetch<OrganizationDomainPayload> {
    const response = await this._request<
      L.OrganizationDomainVerifyMutation,
      L.OrganizationDomainVerifyMutationVariables
    >(L.OrganizationDomainVerifyDocument, {
      input,
    });
    const data = response.organizationDomainVerify;
    return new OrganizationDomainPayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationInviteCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationInviteCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationInviteCreate mutation and return a OrganizationInvitePayload
   *
   * @param input - required input to pass to organizationInviteCreate
   * @returns parsed response from OrganizationInviteCreateMutation
   */
  public async fetch(input: L.OrganizationInviteCreateInput): LinearFetch<OrganizationInvitePayload> {
    const response = await this._request<
      L.OrganizationInviteCreateMutation,
      L.OrganizationInviteCreateMutationVariables
    >(L.OrganizationInviteCreateDocument, {
      input,
    });
    const data = response.organizationInviteCreate;
    return new OrganizationInvitePayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationInviteDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationInviteDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationInviteDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to organizationInviteDelete
   * @returns parsed response from OrganizationInviteDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<
      L.OrganizationInviteDeleteMutation,
      L.OrganizationInviteDeleteMutationVariables
    >(L.OrganizationInviteDeleteDocument, {
      id,
    });
    const data = response.organizationInviteDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable OrganizationUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class OrganizationUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the OrganizationUpdate mutation and return a OrganizationPayload
   *
   * @param input - required input to pass to organizationUpdate
   * @returns parsed response from OrganizationUpdateMutation
   */
  public async fetch(input: L.UpdateOrganizationInput): LinearFetch<OrganizationPayload> {
    const response = await this._request<L.OrganizationUpdateMutation, L.OrganizationUpdateMutationVariables>(
      L.OrganizationUpdateDocument,
      {
        input,
      }
    );
    const data = response.organizationUpdate;
    return new OrganizationPayload(this._request, data);
  }
}

/**
 * A fetchable ProjectArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class ProjectArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to projectArchive
   * @returns parsed response from ProjectArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.ProjectArchiveMutation, L.ProjectArchiveMutationVariables>(
      L.ProjectArchiveDocument,
      {
        id,
      }
    );
    const data = response.projectArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable ProjectCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class ProjectCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectCreate mutation and return a ProjectPayload
   *
   * @param input - required input to pass to projectCreate
   * @returns parsed response from ProjectCreateMutation
   */
  public async fetch(input: L.ProjectCreateInput): LinearFetch<ProjectPayload> {
    const response = await this._request<L.ProjectCreateMutation, L.ProjectCreateMutationVariables>(
      L.ProjectCreateDocument,
      {
        input,
      }
    );
    const data = response.projectCreate;
    return new ProjectPayload(this._request, data);
  }
}

/**
 * A fetchable ProjectLinkCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class ProjectLinkCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectLinkCreate mutation and return a ProjectLinkPayload
   *
   * @param input - required input to pass to projectLinkCreate
   * @returns parsed response from ProjectLinkCreateMutation
   */
  public async fetch(input: L.ProjectLinkCreateInput): LinearFetch<ProjectLinkPayload> {
    const response = await this._request<L.ProjectLinkCreateMutation, L.ProjectLinkCreateMutationVariables>(
      L.ProjectLinkCreateDocument,
      {
        input,
      }
    );
    const data = response.projectLinkCreate;
    return new ProjectLinkPayload(this._request, data);
  }
}

/**
 * A fetchable ProjectLinkDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class ProjectLinkDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectLinkDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to projectLinkDelete
   * @returns parsed response from ProjectLinkDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.ProjectLinkDeleteMutation, L.ProjectLinkDeleteMutationVariables>(
      L.ProjectLinkDeleteDocument,
      {
        id,
      }
    );
    const data = response.projectLinkDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable ProjectUnarchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class ProjectUnarchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectUnarchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to projectUnarchive
   * @returns parsed response from ProjectUnarchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.ProjectUnarchiveMutation, L.ProjectUnarchiveMutationVariables>(
      L.ProjectUnarchiveDocument,
      {
        id,
      }
    );
    const data = response.projectUnarchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable ProjectUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class ProjectUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ProjectUpdate mutation and return a ProjectPayload
   *
   * @param id - required id to pass to projectUpdate
   * @param input - required input to pass to projectUpdate
   * @returns parsed response from ProjectUpdateMutation
   */
  public async fetch(id: string, input: L.ProjectUpdateInput): LinearFetch<ProjectPayload> {
    const response = await this._request<L.ProjectUpdateMutation, L.ProjectUpdateMutationVariables>(
      L.ProjectUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.projectUpdate;
    return new ProjectPayload(this._request, data);
  }
}

/**
 * A fetchable PushSubscriptionCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class PushSubscriptionCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the PushSubscriptionCreate mutation and return a PushSubscriptionPayload
   *
   * @param input - required input to pass to pushSubscriptionCreate
   * @returns parsed response from PushSubscriptionCreateMutation
   */
  public async fetch(input: L.PushSubscriptionCreateInput): LinearFetch<PushSubscriptionPayload> {
    const response = await this._request<L.PushSubscriptionCreateMutation, L.PushSubscriptionCreateMutationVariables>(
      L.PushSubscriptionCreateDocument,
      {
        input,
      }
    );
    const data = response.pushSubscriptionCreate;
    return new PushSubscriptionPayload(this._request, data);
  }
}

/**
 * A fetchable PushSubscriptionDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class PushSubscriptionDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the PushSubscriptionDelete mutation and return a PushSubscriptionPayload
   *
   * @param id - required id to pass to pushSubscriptionDelete
   * @returns parsed response from PushSubscriptionDeleteMutation
   */
  public async fetch(id: string): LinearFetch<PushSubscriptionPayload> {
    const response = await this._request<L.PushSubscriptionDeleteMutation, L.PushSubscriptionDeleteMutationVariables>(
      L.PushSubscriptionDeleteDocument,
      {
        id,
      }
    );
    const data = response.pushSubscriptionDelete;
    return new PushSubscriptionPayload(this._request, data);
  }
}

/**
 * A fetchable ReactionCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class ReactionCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ReactionCreate mutation and return a ReactionPayload
   *
   * @param input - required input to pass to reactionCreate
   * @returns parsed response from ReactionCreateMutation
   */
  public async fetch(input: L.ReactionCreateInput): LinearFetch<ReactionPayload> {
    const response = await this._request<L.ReactionCreateMutation, L.ReactionCreateMutationVariables>(
      L.ReactionCreateDocument,
      {
        input,
      }
    );
    const data = response.reactionCreate;
    return new ReactionPayload(this._request, data);
  }
}

/**
 * A fetchable ReactionDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class ReactionDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ReactionDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to reactionDelete
   * @returns parsed response from ReactionDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.ReactionDeleteMutation, L.ReactionDeleteMutationVariables>(
      L.ReactionDeleteDocument,
      {
        id,
      }
    );
    const data = response.reactionDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable RefreshGoogleSheetsData Mutation
 *
 * @param request - function to call the graphql client
 */
export class RefreshGoogleSheetsDataMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the RefreshGoogleSheetsData mutation and return a IntegrationPayload
   *
   * @param id - required id to pass to refreshGoogleSheetsData
   * @returns parsed response from RefreshGoogleSheetsDataMutation
   */
  public async fetch(id: string): LinearFetch<IntegrationPayload> {
    const response = await this._request<L.RefreshGoogleSheetsDataMutation, L.RefreshGoogleSheetsDataMutationVariables>(
      L.RefreshGoogleSheetsDataDocument,
      {
        id,
      }
    );
    const data = response.refreshGoogleSheetsData;
    return new IntegrationPayload(this._request, data);
  }
}

/**
 * A fetchable ResendOrganizationInvite Mutation
 *
 * @param request - function to call the graphql client
 */
export class ResendOrganizationInviteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ResendOrganizationInvite mutation and return a ArchivePayload
   *
   * @param id - required id to pass to resendOrganizationInvite
   * @returns parsed response from ResendOrganizationInviteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<
      L.ResendOrganizationInviteMutation,
      L.ResendOrganizationInviteMutationVariables
    >(L.ResendOrganizationInviteDocument, {
      id,
    });
    const data = response.resendOrganizationInvite;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable SamlTokenUserAccountAuth Mutation
 *
 * @param request - function to call the graphql client
 */
export class SamlTokenUserAccountAuthMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the SamlTokenUserAccountAuth mutation and return a AuthResolverResponse
   *
   * @param input - required input to pass to samlTokenUserAccountAuth
   * @returns parsed response from SamlTokenUserAccountAuthMutation
   */
  public async fetch(input: L.TokenUserAccountAuthInput): LinearFetch<AuthResolverResponse> {
    const response = await this._request<
      L.SamlTokenUserAccountAuthMutation,
      L.SamlTokenUserAccountAuthMutationVariables
    >(L.SamlTokenUserAccountAuthDocument, {
      input,
    });
    const data = response.samlTokenUserAccountAuth;
    return new AuthResolverResponse(this._request, data);
  }
}

/**
 * A fetchable TeamCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class TeamCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamCreate mutation and return a TeamPayload
   *
   * @param input - required input to pass to teamCreate
   * @param variables - variables without 'input' to pass into the TeamCreateMutation
   * @returns parsed response from TeamCreateMutation
   */
  public async fetch(
    input: L.TeamCreateInput,
    variables?: Omit<L.TeamCreateMutationVariables, "input">
  ): LinearFetch<TeamPayload> {
    const response = await this._request<L.TeamCreateMutation, L.TeamCreateMutationVariables>(L.TeamCreateDocument, {
      input,
      ...variables,
    });
    const data = response.teamCreate;
    return new TeamPayload(this._request, data);
  }
}

/**
 * A fetchable TeamDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class TeamDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to teamDelete
   * @returns parsed response from TeamDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.TeamDeleteMutation, L.TeamDeleteMutationVariables>(L.TeamDeleteDocument, {
      id,
    });
    const data = response.teamDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable TeamKeyDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class TeamKeyDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamKeyDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to teamKeyDelete
   * @returns parsed response from TeamKeyDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.TeamKeyDeleteMutation, L.TeamKeyDeleteMutationVariables>(
      L.TeamKeyDeleteDocument,
      {
        id,
      }
    );
    const data = response.teamKeyDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable TeamMembershipCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class TeamMembershipCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamMembershipCreate mutation and return a TeamMembershipPayload
   *
   * @param input - required input to pass to teamMembershipCreate
   * @returns parsed response from TeamMembershipCreateMutation
   */
  public async fetch(input: L.TeamMembershipCreateInput): LinearFetch<TeamMembershipPayload> {
    const response = await this._request<L.TeamMembershipCreateMutation, L.TeamMembershipCreateMutationVariables>(
      L.TeamMembershipCreateDocument,
      {
        input,
      }
    );
    const data = response.teamMembershipCreate;
    return new TeamMembershipPayload(this._request, data);
  }
}

/**
 * A fetchable TeamMembershipDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class TeamMembershipDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamMembershipDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to teamMembershipDelete
   * @returns parsed response from TeamMembershipDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.TeamMembershipDeleteMutation, L.TeamMembershipDeleteMutationVariables>(
      L.TeamMembershipDeleteDocument,
      {
        id,
      }
    );
    const data = response.teamMembershipDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable TeamMembershipUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class TeamMembershipUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamMembershipUpdate mutation and return a TeamMembershipPayload
   *
   * @param id - required id to pass to teamMembershipUpdate
   * @param input - required input to pass to teamMembershipUpdate
   * @returns parsed response from TeamMembershipUpdateMutation
   */
  public async fetch(id: string, input: L.TeamMembershipUpdateInput): LinearFetch<TeamMembershipPayload> {
    const response = await this._request<L.TeamMembershipUpdateMutation, L.TeamMembershipUpdateMutationVariables>(
      L.TeamMembershipUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.teamMembershipUpdate;
    return new TeamMembershipPayload(this._request, data);
  }
}

/**
 * A fetchable TeamUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class TeamUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TeamUpdate mutation and return a TeamPayload
   *
   * @param id - required id to pass to teamUpdate
   * @param input - required input to pass to teamUpdate
   * @returns parsed response from TeamUpdateMutation
   */
  public async fetch(id: string, input: L.TeamUpdateInput): LinearFetch<TeamPayload> {
    const response = await this._request<L.TeamUpdateMutation, L.TeamUpdateMutationVariables>(L.TeamUpdateDocument, {
      id,
      input,
    });
    const data = response.teamUpdate;
    return new TeamPayload(this._request, data);
  }
}

/**
 * A fetchable TemplateCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class TemplateCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TemplateCreate mutation and return a TemplatePayload
   *
   * @param input - required input to pass to templateCreate
   * @returns parsed response from TemplateCreateMutation
   */
  public async fetch(input: L.TemplateCreateInput): LinearFetch<TemplatePayload> {
    const response = await this._request<L.TemplateCreateMutation, L.TemplateCreateMutationVariables>(
      L.TemplateCreateDocument,
      {
        input,
      }
    );
    const data = response.templateCreate;
    return new TemplatePayload(this._request, data);
  }
}

/**
 * A fetchable TemplateDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class TemplateDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TemplateDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to templateDelete
   * @returns parsed response from TemplateDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.TemplateDeleteMutation, L.TemplateDeleteMutationVariables>(
      L.TemplateDeleteDocument,
      {
        id,
      }
    );
    const data = response.templateDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable TemplateUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class TemplateUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the TemplateUpdate mutation and return a TemplatePayload
   *
   * @param id - required id to pass to templateUpdate
   * @param input - required input to pass to templateUpdate
   * @returns parsed response from TemplateUpdateMutation
   */
  public async fetch(id: string, input: L.TemplateUpdateInput): LinearFetch<TemplatePayload> {
    const response = await this._request<L.TemplateUpdateMutation, L.TemplateUpdateMutationVariables>(
      L.TemplateUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.templateUpdate;
    return new TemplatePayload(this._request, data);
  }
}

/**
 * A fetchable UserDemoteAdmin Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserDemoteAdminMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserDemoteAdmin mutation and return a UserAdminPayload
   *
   * @param id - required id to pass to userDemoteAdmin
   * @returns parsed response from UserDemoteAdminMutation
   */
  public async fetch(id: string): LinearFetch<UserAdminPayload> {
    const response = await this._request<L.UserDemoteAdminMutation, L.UserDemoteAdminMutationVariables>(
      L.UserDemoteAdminDocument,
      {
        id,
      }
    );
    const data = response.userDemoteAdmin;
    return new UserAdminPayload(this._request, data);
  }
}

/**
 * A fetchable UserFlagUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserFlagUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserFlagUpdate mutation and return a UserSettingsFlagPayload
   *
   * @param flag - required flag to pass to userFlagUpdate
   * @param operation - required operation to pass to userFlagUpdate
   * @returns parsed response from UserFlagUpdateMutation
   */
  public async fetch(flag: L.UserFlagType, operation: L.UserFlagUpdateOperation): LinearFetch<UserSettingsFlagPayload> {
    const response = await this._request<L.UserFlagUpdateMutation, L.UserFlagUpdateMutationVariables>(
      L.UserFlagUpdateDocument,
      {
        flag,
        operation,
      }
    );
    const data = response.userFlagUpdate;
    return new UserSettingsFlagPayload(this._request, data);
  }
}

/**
 * A fetchable UserPromoteAdmin Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserPromoteAdminMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserPromoteAdmin mutation and return a UserAdminPayload
   *
   * @param id - required id to pass to userPromoteAdmin
   * @returns parsed response from UserPromoteAdminMutation
   */
  public async fetch(id: string): LinearFetch<UserAdminPayload> {
    const response = await this._request<L.UserPromoteAdminMutation, L.UserPromoteAdminMutationVariables>(
      L.UserPromoteAdminDocument,
      {
        id,
      }
    );
    const data = response.userPromoteAdmin;
    return new UserAdminPayload(this._request, data);
  }
}

/**
 * A fetchable UserSettingsFlagIncrement Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserSettingsFlagIncrementMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserSettingsFlagIncrement mutation and return a UserSettingsFlagPayload
   *
   * @param flag - required flag to pass to userSettingsFlagIncrement
   * @returns parsed response from UserSettingsFlagIncrementMutation
   */
  public async fetch(flag: string): LinearFetch<UserSettingsFlagPayload> {
    const response = await this._request<
      L.UserSettingsFlagIncrementMutation,
      L.UserSettingsFlagIncrementMutationVariables
    >(L.UserSettingsFlagIncrementDocument, {
      flag,
    });
    const data = response.userSettingsFlagIncrement;
    return new UserSettingsFlagPayload(this._request, data);
  }
}

/**
 * A fetchable UserSettingsFlagsReset Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserSettingsFlagsResetMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserSettingsFlagsReset mutation and return a UserSettingsFlagsResetPayload
   *
   * @returns parsed response from UserSettingsFlagsResetMutation
   */
  public async fetch(): LinearFetch<UserSettingsFlagsResetPayload> {
    const response = await this._request<L.UserSettingsFlagsResetMutation, L.UserSettingsFlagsResetMutationVariables>(
      L.UserSettingsFlagsResetDocument,
      {}
    );
    const data = response.userSettingsFlagsReset;
    return new UserSettingsFlagsResetPayload(this._request, data);
  }
}

/**
 * A fetchable UserSettingsUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserSettingsUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserSettingsUpdate mutation and return a UserSettingsPayload
   *
   * @param id - required id to pass to userSettingsUpdate
   * @param input - required input to pass to userSettingsUpdate
   * @returns parsed response from UserSettingsUpdateMutation
   */
  public async fetch(id: string, input: L.UserSettingsUpdateInput): LinearFetch<UserSettingsPayload> {
    const response = await this._request<L.UserSettingsUpdateMutation, L.UserSettingsUpdateMutationVariables>(
      L.UserSettingsUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.userSettingsUpdate;
    return new UserSettingsPayload(this._request, data);
  }
}

/**
 * A fetchable UserSubscribeToNewsletter Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserSubscribeToNewsletterMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserSubscribeToNewsletter mutation and return a UserSubscribeToNewsletterPayload
   *
   * @returns parsed response from UserSubscribeToNewsletterMutation
   */
  public async fetch(): LinearFetch<UserSubscribeToNewsletterPayload> {
    const response = await this._request<
      L.UserSubscribeToNewsletterMutation,
      L.UserSubscribeToNewsletterMutationVariables
    >(L.UserSubscribeToNewsletterDocument, {});
    const data = response.userSubscribeToNewsletter;
    return new UserSubscribeToNewsletterPayload(this._request, data);
  }
}

/**
 * A fetchable UserSuspend Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserSuspendMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserSuspend mutation and return a UserAdminPayload
   *
   * @param id - required id to pass to userSuspend
   * @returns parsed response from UserSuspendMutation
   */
  public async fetch(id: string): LinearFetch<UserAdminPayload> {
    const response = await this._request<L.UserSuspendMutation, L.UserSuspendMutationVariables>(L.UserSuspendDocument, {
      id,
    });
    const data = response.userSuspend;
    return new UserAdminPayload(this._request, data);
  }
}

/**
 * A fetchable UserUnsuspend Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserUnsuspendMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserUnsuspend mutation and return a UserAdminPayload
   *
   * @param id - required id to pass to userUnsuspend
   * @returns parsed response from UserUnsuspendMutation
   */
  public async fetch(id: string): LinearFetch<UserAdminPayload> {
    const response = await this._request<L.UserUnsuspendMutation, L.UserUnsuspendMutationVariables>(
      L.UserUnsuspendDocument,
      {
        id,
      }
    );
    const data = response.userUnsuspend;
    return new UserAdminPayload(this._request, data);
  }
}

/**
 * A fetchable UserUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class UserUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the UserUpdate mutation and return a UserPayload
   *
   * @param id - required id to pass to userUpdate
   * @param input - required input to pass to userUpdate
   * @returns parsed response from UserUpdateMutation
   */
  public async fetch(id: string, input: L.UpdateUserInput): LinearFetch<UserPayload> {
    const response = await this._request<L.UserUpdateMutation, L.UserUpdateMutationVariables>(L.UserUpdateDocument, {
      id,
      input,
    });
    const data = response.userUpdate;
    return new UserPayload(this._request, data);
  }
}

/**
 * A fetchable ViewPreferencesCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class ViewPreferencesCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ViewPreferencesCreate mutation and return a ViewPreferencesPayload
   *
   * @param input - required input to pass to viewPreferencesCreate
   * @returns parsed response from ViewPreferencesCreateMutation
   */
  public async fetch(input: L.ViewPreferencesCreateInput): LinearFetch<ViewPreferencesPayload> {
    const response = await this._request<L.ViewPreferencesCreateMutation, L.ViewPreferencesCreateMutationVariables>(
      L.ViewPreferencesCreateDocument,
      {
        input,
      }
    );
    const data = response.viewPreferencesCreate;
    return new ViewPreferencesPayload(this._request, data);
  }
}

/**
 * A fetchable ViewPreferencesDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class ViewPreferencesDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ViewPreferencesDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to viewPreferencesDelete
   * @returns parsed response from ViewPreferencesDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.ViewPreferencesDeleteMutation, L.ViewPreferencesDeleteMutationVariables>(
      L.ViewPreferencesDeleteDocument,
      {
        id,
      }
    );
    const data = response.viewPreferencesDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable ViewPreferencesUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class ViewPreferencesUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the ViewPreferencesUpdate mutation and return a ViewPreferencesPayload
   *
   * @param id - required id to pass to viewPreferencesUpdate
   * @param input - required input to pass to viewPreferencesUpdate
   * @returns parsed response from ViewPreferencesUpdateMutation
   */
  public async fetch(id: string, input: L.ViewPreferencesUpdateInput): LinearFetch<ViewPreferencesPayload> {
    const response = await this._request<L.ViewPreferencesUpdateMutation, L.ViewPreferencesUpdateMutationVariables>(
      L.ViewPreferencesUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.viewPreferencesUpdate;
    return new ViewPreferencesPayload(this._request, data);
  }
}

/**
 * A fetchable WebhookCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class WebhookCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WebhookCreate mutation and return a WebhookPayload
   *
   * @param input - required input to pass to webhookCreate
   * @returns parsed response from WebhookCreateMutation
   */
  public async fetch(input: L.WebhookCreateInput): LinearFetch<WebhookPayload> {
    const response = await this._request<L.WebhookCreateMutation, L.WebhookCreateMutationVariables>(
      L.WebhookCreateDocument,
      {
        input,
      }
    );
    const data = response.webhookCreate;
    return new WebhookPayload(this._request, data);
  }
}

/**
 * A fetchable WebhookDelete Mutation
 *
 * @param request - function to call the graphql client
 */
export class WebhookDeleteMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WebhookDelete mutation and return a ArchivePayload
   *
   * @param id - required id to pass to webhookDelete
   * @returns parsed response from WebhookDeleteMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.WebhookDeleteMutation, L.WebhookDeleteMutationVariables>(
      L.WebhookDeleteDocument,
      {
        id,
      }
    );
    const data = response.webhookDelete;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable WebhookUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class WebhookUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WebhookUpdate mutation and return a WebhookPayload
   *
   * @param id - required id to pass to webhookUpdate
   * @param input - required input to pass to webhookUpdate
   * @returns parsed response from WebhookUpdateMutation
   */
  public async fetch(id: string, input: L.WebhookUpdateInput): LinearFetch<WebhookPayload> {
    const response = await this._request<L.WebhookUpdateMutation, L.WebhookUpdateMutationVariables>(
      L.WebhookUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.webhookUpdate;
    return new WebhookPayload(this._request, data);
  }
}

/**
 * A fetchable WorkflowStateArchive Mutation
 *
 * @param request - function to call the graphql client
 */
export class WorkflowStateArchiveMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WorkflowStateArchive mutation and return a ArchivePayload
   *
   * @param id - required id to pass to workflowStateArchive
   * @returns parsed response from WorkflowStateArchiveMutation
   */
  public async fetch(id: string): LinearFetch<ArchivePayload> {
    const response = await this._request<L.WorkflowStateArchiveMutation, L.WorkflowStateArchiveMutationVariables>(
      L.WorkflowStateArchiveDocument,
      {
        id,
      }
    );
    const data = response.workflowStateArchive;
    return new ArchivePayload(this._request, data);
  }
}

/**
 * A fetchable WorkflowStateCreate Mutation
 *
 * @param request - function to call the graphql client
 */
export class WorkflowStateCreateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WorkflowStateCreate mutation and return a WorkflowStatePayload
   *
   * @param input - required input to pass to workflowStateCreate
   * @returns parsed response from WorkflowStateCreateMutation
   */
  public async fetch(input: L.WorkflowStateCreateInput): LinearFetch<WorkflowStatePayload> {
    const response = await this._request<L.WorkflowStateCreateMutation, L.WorkflowStateCreateMutationVariables>(
      L.WorkflowStateCreateDocument,
      {
        input,
      }
    );
    const data = response.workflowStateCreate;
    return new WorkflowStatePayload(this._request, data);
  }
}

/**
 * A fetchable WorkflowStateUpdate Mutation
 *
 * @param request - function to call the graphql client
 */
export class WorkflowStateUpdateMutation extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the WorkflowStateUpdate mutation and return a WorkflowStatePayload
   *
   * @param id - required id to pass to workflowStateUpdate
   * @param input - required input to pass to workflowStateUpdate
   * @returns parsed response from WorkflowStateUpdateMutation
   */
  public async fetch(id: string, input: L.WorkflowStateUpdateInput): LinearFetch<WorkflowStatePayload> {
    const response = await this._request<L.WorkflowStateUpdateMutation, L.WorkflowStateUpdateMutationVariables>(
      L.WorkflowStateUpdateDocument,
      {
        id,
        input,
      }
    );
    const data = response.workflowStateUpdate;
    return new WorkflowStatePayload(this._request, data);
  }
}

/**
 * A fetchable AttachmentIssue_Attachments Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_AttachmentsQuery
 */
export class AttachmentIssue_AttachmentsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_AttachmentsQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_AttachmentsQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_Attachments query and return a AttachmentConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_AttachmentsQuery
   * @returns parsed response from AttachmentIssue_AttachmentsQuery
   */
  public async fetch(
    variables?: Omit<L.AttachmentIssue_AttachmentsQueryVariables, "id">
  ): LinearFetch<AttachmentConnection> {
    const response = await this._request<
      L.AttachmentIssue_AttachmentsQuery,
      L.AttachmentIssue_AttachmentsQueryVariables
    >(L.AttachmentIssue_AttachmentsDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.attachmentIssue.attachments;
    return new AttachmentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentIssue_Children Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_ChildrenQuery
 */
export class AttachmentIssue_ChildrenQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_ChildrenQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_ChildrenQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_Children query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_ChildrenQuery
   * @returns parsed response from AttachmentIssue_ChildrenQuery
   */
  public async fetch(variables?: Omit<L.AttachmentIssue_ChildrenQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.AttachmentIssue_ChildrenQuery, L.AttachmentIssue_ChildrenQueryVariables>(
      L.AttachmentIssue_ChildrenDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.attachmentIssue.children;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentIssue_Comments Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_CommentsQuery
 */
export class AttachmentIssue_CommentsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_CommentsQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_CommentsQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_Comments query and return a CommentConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_CommentsQuery
   * @returns parsed response from AttachmentIssue_CommentsQuery
   */
  public async fetch(variables?: Omit<L.AttachmentIssue_CommentsQueryVariables, "id">): LinearFetch<CommentConnection> {
    const response = await this._request<L.AttachmentIssue_CommentsQuery, L.AttachmentIssue_CommentsQueryVariables>(
      L.AttachmentIssue_CommentsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.attachmentIssue.comments;
    return new CommentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentIssue_History Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_HistoryQuery
 */
export class AttachmentIssue_HistoryQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_HistoryQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_HistoryQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_History query and return a IssueHistoryConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_HistoryQuery
   * @returns parsed response from AttachmentIssue_HistoryQuery
   */
  public async fetch(
    variables?: Omit<L.AttachmentIssue_HistoryQueryVariables, "id">
  ): LinearFetch<IssueHistoryConnection> {
    const response = await this._request<L.AttachmentIssue_HistoryQuery, L.AttachmentIssue_HistoryQueryVariables>(
      L.AttachmentIssue_HistoryDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.attachmentIssue.history;
    return new IssueHistoryConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentIssue_InverseRelations Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_InverseRelationsQuery
 */
export class AttachmentIssue_InverseRelationsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_InverseRelationsQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_InverseRelationsQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_InverseRelations query and return a IssueRelationConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_InverseRelationsQuery
   * @returns parsed response from AttachmentIssue_InverseRelationsQuery
   */
  public async fetch(
    variables?: Omit<L.AttachmentIssue_InverseRelationsQueryVariables, "id">
  ): LinearFetch<IssueRelationConnection> {
    const response = await this._request<
      L.AttachmentIssue_InverseRelationsQuery,
      L.AttachmentIssue_InverseRelationsQueryVariables
    >(L.AttachmentIssue_InverseRelationsDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.attachmentIssue.inverseRelations;
    return new IssueRelationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentIssue_Labels Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_LabelsQuery
 */
export class AttachmentIssue_LabelsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_LabelsQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_LabelsQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_Labels query and return a IssueLabelConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_LabelsQuery
   * @returns parsed response from AttachmentIssue_LabelsQuery
   */
  public async fetch(
    variables?: Omit<L.AttachmentIssue_LabelsQueryVariables, "id">
  ): LinearFetch<IssueLabelConnection> {
    const response = await this._request<L.AttachmentIssue_LabelsQuery, L.AttachmentIssue_LabelsQueryVariables>(
      L.AttachmentIssue_LabelsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.attachmentIssue.labels;
    return new IssueLabelConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentIssue_Relations Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_RelationsQuery
 */
export class AttachmentIssue_RelationsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_RelationsQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_RelationsQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_Relations query and return a IssueRelationConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_RelationsQuery
   * @returns parsed response from AttachmentIssue_RelationsQuery
   */
  public async fetch(
    variables?: Omit<L.AttachmentIssue_RelationsQueryVariables, "id">
  ): LinearFetch<IssueRelationConnection> {
    const response = await this._request<L.AttachmentIssue_RelationsQuery, L.AttachmentIssue_RelationsQueryVariables>(
      L.AttachmentIssue_RelationsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.attachmentIssue.relations;
    return new IssueRelationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable AttachmentIssue_Subscribers Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to attachmentIssue
 * @param variables - variables without 'id' to pass into the AttachmentIssue_SubscribersQuery
 */
export class AttachmentIssue_SubscribersQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.AttachmentIssue_SubscribersQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.AttachmentIssue_SubscribersQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the AttachmentIssue_Subscribers query and return a UserConnection
   *
   * @param variables - variables without 'id' to pass into the AttachmentIssue_SubscribersQuery
   * @returns parsed response from AttachmentIssue_SubscribersQuery
   */
  public async fetch(variables?: Omit<L.AttachmentIssue_SubscribersQueryVariables, "id">): LinearFetch<UserConnection> {
    const response = await this._request<
      L.AttachmentIssue_SubscribersQuery,
      L.AttachmentIssue_SubscribersQueryVariables
    >(L.AttachmentIssue_SubscribersDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.attachmentIssue.subscribers;
    return new UserConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable BillingDetails_PaymentMethod Query
 *
 * @param request - function to call the graphql client
 */
export class BillingDetails_PaymentMethodQuery extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * Call the BillingDetails_PaymentMethod query and return a Card
   *
   * @returns parsed response from BillingDetails_PaymentMethodQuery
   */
  public async fetch(): LinearFetch<Card | undefined> {
    const response = await this._request<
      L.BillingDetails_PaymentMethodQuery,
      L.BillingDetails_PaymentMethodQueryVariables
    >(L.BillingDetails_PaymentMethodDocument, {});
    const data = response.billingDetails.paymentMethod;
    return data ? new Card(this._request, data) : undefined;
  }
}

/**
 * A fetchable CollaborativeDocumentJoin_Steps Query
 *
 * @param request - function to call the graphql client
 * @param clientId - required clientId to pass to collaborativeDocumentJoin
 * @param issueId - required issueId to pass to collaborativeDocumentJoin
 * @param version - required version to pass to collaborativeDocumentJoin
 */
export class CollaborativeDocumentJoin_StepsQuery extends Request {
  private _clientId: string;
  private _issueId: string;
  private _version: number;

  public constructor(request: LinearRequest, clientId: string, issueId: string, version: number) {
    super(request);
    this._clientId = clientId;
    this._issueId = issueId;
    this._version = version;
  }

  /**
   * Call the CollaborativeDocumentJoin_Steps query and return a StepsResponse
   *
   * @returns parsed response from CollaborativeDocumentJoin_StepsQuery
   */
  public async fetch(): LinearFetch<StepsResponse | undefined> {
    const response = await this._request<
      L.CollaborativeDocumentJoin_StepsQuery,
      L.CollaborativeDocumentJoin_StepsQueryVariables
    >(L.CollaborativeDocumentJoin_StepsDocument, {
      clientId: this._clientId,
      issueId: this._issueId,
      version: this._version,
    });
    const data = response.collaborativeDocumentJoin.steps;
    return data ? new StepsResponse(this._request, data) : undefined;
  }
}

/**
 * A fetchable Cycle_Issues Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to cycle
 * @param variables - variables without 'id' to pass into the Cycle_IssuesQuery
 */
export class Cycle_IssuesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Cycle_IssuesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Cycle_IssuesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Cycle_Issues query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the Cycle_IssuesQuery
   * @returns parsed response from Cycle_IssuesQuery
   */
  public async fetch(variables?: Omit<L.Cycle_IssuesQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.Cycle_IssuesQuery, L.Cycle_IssuesQueryVariables>(L.Cycle_IssuesDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.cycle.issues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Cycle_UncompletedIssuesUponClose Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to cycle
 * @param variables - variables without 'id' to pass into the Cycle_UncompletedIssuesUponCloseQuery
 */
export class Cycle_UncompletedIssuesUponCloseQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Cycle_UncompletedIssuesUponCloseQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.Cycle_UncompletedIssuesUponCloseQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Cycle_UncompletedIssuesUponClose query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the Cycle_UncompletedIssuesUponCloseQuery
   * @returns parsed response from Cycle_UncompletedIssuesUponCloseQuery
   */
  public async fetch(
    variables?: Omit<L.Cycle_UncompletedIssuesUponCloseQueryVariables, "id">
  ): LinearFetch<IssueConnection> {
    const response = await this._request<
      L.Cycle_UncompletedIssuesUponCloseQuery,
      L.Cycle_UncompletedIssuesUponCloseQueryVariables
    >(L.Cycle_UncompletedIssuesUponCloseDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.cycle.uncompletedIssuesUponClose;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Favorite_Children Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to favorite
 * @param variables - variables without 'id' to pass into the Favorite_ChildrenQuery
 */
export class Favorite_ChildrenQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Favorite_ChildrenQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Favorite_ChildrenQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Favorite_Children query and return a FavoriteConnection
   *
   * @param variables - variables without 'id' to pass into the Favorite_ChildrenQuery
   * @returns parsed response from Favorite_ChildrenQuery
   */
  public async fetch(variables?: Omit<L.Favorite_ChildrenQueryVariables, "id">): LinearFetch<FavoriteConnection> {
    const response = await this._request<L.Favorite_ChildrenQuery, L.Favorite_ChildrenQueryVariables>(
      L.Favorite_ChildrenDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.favorite.children;
    return new FavoriteConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable FigmaEmbedInfo_FigmaEmbed Query
 *
 * @param request - function to call the graphql client
 * @param fileId - required fileId to pass to figmaEmbedInfo
 * @param variables - variables without 'fileId' to pass into the FigmaEmbedInfo_FigmaEmbedQuery
 */
export class FigmaEmbedInfo_FigmaEmbedQuery extends Request {
  private _fileId: string;
  private _variables?: Omit<L.FigmaEmbedInfo_FigmaEmbedQueryVariables, "fileId">;

  public constructor(
    request: LinearRequest,
    fileId: string,
    variables?: Omit<L.FigmaEmbedInfo_FigmaEmbedQueryVariables, "fileId">
  ) {
    super(request);
    this._fileId = fileId;
    this._variables = variables;
  }

  /**
   * Call the FigmaEmbedInfo_FigmaEmbed query and return a FigmaEmbed
   *
   * @param variables - variables without 'fileId' to pass into the FigmaEmbedInfo_FigmaEmbedQuery
   * @returns parsed response from FigmaEmbedInfo_FigmaEmbedQuery
   */
  public async fetch(
    variables?: Omit<L.FigmaEmbedInfo_FigmaEmbedQueryVariables, "fileId">
  ): LinearFetch<FigmaEmbed | undefined> {
    const response = await this._request<L.FigmaEmbedInfo_FigmaEmbedQuery, L.FigmaEmbedInfo_FigmaEmbedQueryVariables>(
      L.FigmaEmbedInfo_FigmaEmbedDocument,
      {
        fileId: this._fileId,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.figmaEmbedInfo.figmaEmbed;
    return data ? new FigmaEmbed(this._request, data) : undefined;
  }
}

/**
 * A fetchable Issue_Attachments Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_AttachmentsQuery
 */
export class Issue_AttachmentsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_AttachmentsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Issue_AttachmentsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_Attachments query and return a AttachmentConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_AttachmentsQuery
   * @returns parsed response from Issue_AttachmentsQuery
   */
  public async fetch(variables?: Omit<L.Issue_AttachmentsQueryVariables, "id">): LinearFetch<AttachmentConnection> {
    const response = await this._request<L.Issue_AttachmentsQuery, L.Issue_AttachmentsQueryVariables>(
      L.Issue_AttachmentsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.issue.attachments;
    return new AttachmentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue_Children Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_ChildrenQuery
 */
export class Issue_ChildrenQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_ChildrenQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Issue_ChildrenQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_Children query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_ChildrenQuery
   * @returns parsed response from Issue_ChildrenQuery
   */
  public async fetch(variables?: Omit<L.Issue_ChildrenQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.Issue_ChildrenQuery, L.Issue_ChildrenQueryVariables>(
      L.Issue_ChildrenDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.issue.children;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue_Comments Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_CommentsQuery
 */
export class Issue_CommentsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_CommentsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Issue_CommentsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_Comments query and return a CommentConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_CommentsQuery
   * @returns parsed response from Issue_CommentsQuery
   */
  public async fetch(variables?: Omit<L.Issue_CommentsQueryVariables, "id">): LinearFetch<CommentConnection> {
    const response = await this._request<L.Issue_CommentsQuery, L.Issue_CommentsQueryVariables>(
      L.Issue_CommentsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.issue.comments;
    return new CommentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue_History Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_HistoryQuery
 */
export class Issue_HistoryQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_HistoryQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Issue_HistoryQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_History query and return a IssueHistoryConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_HistoryQuery
   * @returns parsed response from Issue_HistoryQuery
   */
  public async fetch(variables?: Omit<L.Issue_HistoryQueryVariables, "id">): LinearFetch<IssueHistoryConnection> {
    const response = await this._request<L.Issue_HistoryQuery, L.Issue_HistoryQueryVariables>(L.Issue_HistoryDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.issue.history;
    return new IssueHistoryConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue_InverseRelations Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_InverseRelationsQuery
 */
export class Issue_InverseRelationsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_InverseRelationsQueryVariables, "id">;

  public constructor(
    request: LinearRequest,
    id: string,
    variables?: Omit<L.Issue_InverseRelationsQueryVariables, "id">
  ) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_InverseRelations query and return a IssueRelationConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_InverseRelationsQuery
   * @returns parsed response from Issue_InverseRelationsQuery
   */
  public async fetch(
    variables?: Omit<L.Issue_InverseRelationsQueryVariables, "id">
  ): LinearFetch<IssueRelationConnection> {
    const response = await this._request<L.Issue_InverseRelationsQuery, L.Issue_InverseRelationsQueryVariables>(
      L.Issue_InverseRelationsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.issue.inverseRelations;
    return new IssueRelationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue_Labels Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_LabelsQuery
 */
export class Issue_LabelsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_LabelsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Issue_LabelsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_Labels query and return a IssueLabelConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_LabelsQuery
   * @returns parsed response from Issue_LabelsQuery
   */
  public async fetch(variables?: Omit<L.Issue_LabelsQueryVariables, "id">): LinearFetch<IssueLabelConnection> {
    const response = await this._request<L.Issue_LabelsQuery, L.Issue_LabelsQueryVariables>(L.Issue_LabelsDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.issue.labels;
    return new IssueLabelConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue_Relations Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_RelationsQuery
 */
export class Issue_RelationsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_RelationsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Issue_RelationsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_Relations query and return a IssueRelationConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_RelationsQuery
   * @returns parsed response from Issue_RelationsQuery
   */
  public async fetch(variables?: Omit<L.Issue_RelationsQueryVariables, "id">): LinearFetch<IssueRelationConnection> {
    const response = await this._request<L.Issue_RelationsQuery, L.Issue_RelationsQueryVariables>(
      L.Issue_RelationsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.issue.relations;
    return new IssueRelationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Issue_Subscribers Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issue
 * @param variables - variables without 'id' to pass into the Issue_SubscribersQuery
 */
export class Issue_SubscribersQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Issue_SubscribersQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Issue_SubscribersQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Issue_Subscribers query and return a UserConnection
   *
   * @param variables - variables without 'id' to pass into the Issue_SubscribersQuery
   * @returns parsed response from Issue_SubscribersQuery
   */
  public async fetch(variables?: Omit<L.Issue_SubscribersQueryVariables, "id">): LinearFetch<UserConnection> {
    const response = await this._request<L.Issue_SubscribersQuery, L.Issue_SubscribersQueryVariables>(
      L.Issue_SubscribersDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.issue.subscribers;
    return new UserConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable IssueLabel_Issues Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to issueLabel
 * @param variables - variables without 'id' to pass into the IssueLabel_IssuesQuery
 */
export class IssueLabel_IssuesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.IssueLabel_IssuesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.IssueLabel_IssuesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the IssueLabel_Issues query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the IssueLabel_IssuesQuery
   * @returns parsed response from IssueLabel_IssuesQuery
   */
  public async fetch(variables?: Omit<L.IssueLabel_IssuesQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.IssueLabel_IssuesQuery, L.IssueLabel_IssuesQueryVariables>(
      L.IssueLabel_IssuesDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.issueLabel.issues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Milestone_Projects Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to milestone
 * @param variables - variables without 'id' to pass into the Milestone_ProjectsQuery
 */
export class Milestone_ProjectsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Milestone_ProjectsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Milestone_ProjectsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Milestone_Projects query and return a ProjectConnection
   *
   * @param variables - variables without 'id' to pass into the Milestone_ProjectsQuery
   * @returns parsed response from Milestone_ProjectsQuery
   */
  public async fetch(variables?: Omit<L.Milestone_ProjectsQueryVariables, "id">): LinearFetch<ProjectConnection> {
    const response = await this._request<L.Milestone_ProjectsQuery, L.Milestone_ProjectsQueryVariables>(
      L.Milestone_ProjectsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.milestone.projects;
    return new ProjectConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Organization_Integrations Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Organization_IntegrationsQuery
 */
export class Organization_IntegrationsQuery extends Request {
  private _variables?: L.Organization_IntegrationsQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Organization_IntegrationsQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Organization_Integrations query and return a IntegrationConnection
   *
   * @param variables - variables to pass into the Organization_IntegrationsQuery
   * @returns parsed response from Organization_IntegrationsQuery
   */
  public async fetch(variables?: L.Organization_IntegrationsQueryVariables): LinearFetch<IntegrationConnection> {
    const response = await this._request<L.Organization_IntegrationsQuery, L.Organization_IntegrationsQueryVariables>(
      L.Organization_IntegrationsDocument,
      variables
    );
    const data = response.organization.integrations;
    return new IntegrationConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Organization_Milestones Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Organization_MilestonesQuery
 */
export class Organization_MilestonesQuery extends Request {
  private _variables?: L.Organization_MilestonesQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Organization_MilestonesQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Organization_Milestones query and return a MilestoneConnection
   *
   * @param variables - variables to pass into the Organization_MilestonesQuery
   * @returns parsed response from Organization_MilestonesQuery
   */
  public async fetch(variables?: L.Organization_MilestonesQueryVariables): LinearFetch<MilestoneConnection> {
    const response = await this._request<L.Organization_MilestonesQuery, L.Organization_MilestonesQueryVariables>(
      L.Organization_MilestonesDocument,
      variables
    );
    const data = response.organization.milestones;
    return new MilestoneConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Organization_Teams Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Organization_TeamsQuery
 */
export class Organization_TeamsQuery extends Request {
  private _variables?: L.Organization_TeamsQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Organization_TeamsQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Organization_Teams query and return a TeamConnection
   *
   * @param variables - variables to pass into the Organization_TeamsQuery
   * @returns parsed response from Organization_TeamsQuery
   */
  public async fetch(variables?: L.Organization_TeamsQueryVariables): LinearFetch<TeamConnection> {
    const response = await this._request<L.Organization_TeamsQuery, L.Organization_TeamsQueryVariables>(
      L.Organization_TeamsDocument,
      variables
    );
    const data = response.organization.teams;
    return new TeamConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Organization_Users Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Organization_UsersQuery
 */
export class Organization_UsersQuery extends Request {
  private _variables?: L.Organization_UsersQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Organization_UsersQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Organization_Users query and return a UserConnection
   *
   * @param variables - variables to pass into the Organization_UsersQuery
   * @returns parsed response from Organization_UsersQuery
   */
  public async fetch(variables?: L.Organization_UsersQueryVariables): LinearFetch<UserConnection> {
    const response = await this._request<L.Organization_UsersQuery, L.Organization_UsersQueryVariables>(
      L.Organization_UsersDocument,
      variables
    );
    const data = response.organization.users;
    return new UserConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Project_Documents Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to project
 * @param variables - variables without 'id' to pass into the Project_DocumentsQuery
 */
export class Project_DocumentsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Project_DocumentsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Project_DocumentsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Project_Documents query and return a DocumentConnection
   *
   * @param variables - variables without 'id' to pass into the Project_DocumentsQuery
   * @returns parsed response from Project_DocumentsQuery
   */
  public async fetch(variables?: Omit<L.Project_DocumentsQueryVariables, "id">): LinearFetch<DocumentConnection> {
    const response = await this._request<L.Project_DocumentsQuery, L.Project_DocumentsQueryVariables>(
      L.Project_DocumentsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.project.documents;
    return new DocumentConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Project_Issues Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to project
 * @param variables - variables without 'id' to pass into the Project_IssuesQuery
 */
export class Project_IssuesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Project_IssuesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Project_IssuesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Project_Issues query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the Project_IssuesQuery
   * @returns parsed response from Project_IssuesQuery
   */
  public async fetch(variables?: Omit<L.Project_IssuesQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.Project_IssuesQuery, L.Project_IssuesQueryVariables>(
      L.Project_IssuesDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.project.issues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Project_Links Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to project
 * @param variables - variables without 'id' to pass into the Project_LinksQuery
 */
export class Project_LinksQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Project_LinksQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Project_LinksQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Project_Links query and return a ProjectLinkConnection
   *
   * @param variables - variables without 'id' to pass into the Project_LinksQuery
   * @returns parsed response from Project_LinksQuery
   */
  public async fetch(variables?: Omit<L.Project_LinksQueryVariables, "id">): LinearFetch<ProjectLinkConnection> {
    const response = await this._request<L.Project_LinksQuery, L.Project_LinksQueryVariables>(L.Project_LinksDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.project.links;
    return new ProjectLinkConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Project_Members Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to project
 * @param variables - variables without 'id' to pass into the Project_MembersQuery
 */
export class Project_MembersQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Project_MembersQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Project_MembersQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Project_Members query and return a UserConnection
   *
   * @param variables - variables without 'id' to pass into the Project_MembersQuery
   * @returns parsed response from Project_MembersQuery
   */
  public async fetch(variables?: Omit<L.Project_MembersQueryVariables, "id">): LinearFetch<UserConnection> {
    const response = await this._request<L.Project_MembersQuery, L.Project_MembersQueryVariables>(
      L.Project_MembersDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.project.members;
    return new UserConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Project_Teams Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to project
 * @param variables - variables without 'id' to pass into the Project_TeamsQuery
 */
export class Project_TeamsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Project_TeamsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Project_TeamsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Project_Teams query and return a TeamConnection
   *
   * @param variables - variables without 'id' to pass into the Project_TeamsQuery
   * @returns parsed response from Project_TeamsQuery
   */
  public async fetch(variables?: Omit<L.Project_TeamsQueryVariables, "id">): LinearFetch<TeamConnection> {
    const response = await this._request<L.Project_TeamsQuery, L.Project_TeamsQueryVariables>(L.Project_TeamsDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.project.teams;
    return new TeamConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_Cycles Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_CyclesQuery
 */
export class Team_CyclesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_CyclesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_CyclesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Cycles query and return a CycleConnection
   *
   * @param variables - variables without 'id' to pass into the Team_CyclesQuery
   * @returns parsed response from Team_CyclesQuery
   */
  public async fetch(variables?: Omit<L.Team_CyclesQueryVariables, "id">): LinearFetch<CycleConnection> {
    const response = await this._request<L.Team_CyclesQuery, L.Team_CyclesQueryVariables>(L.Team_CyclesDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.team.cycles;
    return new CycleConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_Issues Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_IssuesQuery
 */
export class Team_IssuesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_IssuesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_IssuesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Issues query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the Team_IssuesQuery
   * @returns parsed response from Team_IssuesQuery
   */
  public async fetch(variables?: Omit<L.Team_IssuesQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.Team_IssuesQuery, L.Team_IssuesQueryVariables>(L.Team_IssuesDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.team.issues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_Labels Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_LabelsQuery
 */
export class Team_LabelsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_LabelsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_LabelsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Labels query and return a IssueLabelConnection
   *
   * @param variables - variables without 'id' to pass into the Team_LabelsQuery
   * @returns parsed response from Team_LabelsQuery
   */
  public async fetch(variables?: Omit<L.Team_LabelsQueryVariables, "id">): LinearFetch<IssueLabelConnection> {
    const response = await this._request<L.Team_LabelsQuery, L.Team_LabelsQueryVariables>(L.Team_LabelsDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.team.labels;
    return new IssueLabelConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_Members Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_MembersQuery
 */
export class Team_MembersQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_MembersQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_MembersQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Members query and return a UserConnection
   *
   * @param variables - variables without 'id' to pass into the Team_MembersQuery
   * @returns parsed response from Team_MembersQuery
   */
  public async fetch(variables?: Omit<L.Team_MembersQueryVariables, "id">): LinearFetch<UserConnection> {
    const response = await this._request<L.Team_MembersQuery, L.Team_MembersQueryVariables>(L.Team_MembersDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.team.members;
    return new UserConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_Memberships Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_MembershipsQuery
 */
export class Team_MembershipsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_MembershipsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_MembershipsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Memberships query and return a TeamMembershipConnection
   *
   * @param variables - variables without 'id' to pass into the Team_MembershipsQuery
   * @returns parsed response from Team_MembershipsQuery
   */
  public async fetch(variables?: Omit<L.Team_MembershipsQueryVariables, "id">): LinearFetch<TeamMembershipConnection> {
    const response = await this._request<L.Team_MembershipsQuery, L.Team_MembershipsQueryVariables>(
      L.Team_MembershipsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.team.memberships;
    return new TeamMembershipConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_Projects Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_ProjectsQuery
 */
export class Team_ProjectsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_ProjectsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_ProjectsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Projects query and return a ProjectConnection
   *
   * @param variables - variables without 'id' to pass into the Team_ProjectsQuery
   * @returns parsed response from Team_ProjectsQuery
   */
  public async fetch(variables?: Omit<L.Team_ProjectsQueryVariables, "id">): LinearFetch<ProjectConnection> {
    const response = await this._request<L.Team_ProjectsQuery, L.Team_ProjectsQueryVariables>(L.Team_ProjectsDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.team.projects;
    return new ProjectConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_States Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_StatesQuery
 */
export class Team_StatesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_StatesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_StatesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_States query and return a WorkflowStateConnection
   *
   * @param variables - variables without 'id' to pass into the Team_StatesQuery
   * @returns parsed response from Team_StatesQuery
   */
  public async fetch(variables?: Omit<L.Team_StatesQueryVariables, "id">): LinearFetch<WorkflowStateConnection> {
    const response = await this._request<L.Team_StatesQuery, L.Team_StatesQueryVariables>(L.Team_StatesDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.team.states;
    return new WorkflowStateConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Team_Templates Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_TemplatesQuery
 */
export class Team_TemplatesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_TemplatesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_TemplatesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Templates query and return a TemplateConnection
   *
   * @param variables - variables without 'id' to pass into the Team_TemplatesQuery
   * @returns parsed response from Team_TemplatesQuery
   */
  public async fetch(variables?: Omit<L.Team_TemplatesQueryVariables, "id">): LinearFetch<TemplateConnection> {
    const response = await this._request<L.Team_TemplatesQuery, L.Team_TemplatesQueryVariables>(
      L.Team_TemplatesDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.team.templates;
    return new TemplateConnection(this._request, data);
  }
}

/**
 * A fetchable Team_Webhooks Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to team
 * @param variables - variables without 'id' to pass into the Team_WebhooksQuery
 */
export class Team_WebhooksQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.Team_WebhooksQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.Team_WebhooksQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the Team_Webhooks query and return a WebhookConnection
   *
   * @param variables - variables without 'id' to pass into the Team_WebhooksQuery
   * @returns parsed response from Team_WebhooksQuery
   */
  public async fetch(variables?: Omit<L.Team_WebhooksQueryVariables, "id">): LinearFetch<WebhookConnection> {
    const response = await this._request<L.Team_WebhooksQuery, L.Team_WebhooksQueryVariables>(L.Team_WebhooksDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.team.webhooks;
    return new WebhookConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable User_AssignedIssues Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to user
 * @param variables - variables without 'id' to pass into the User_AssignedIssuesQuery
 */
export class User_AssignedIssuesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.User_AssignedIssuesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.User_AssignedIssuesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the User_AssignedIssues query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the User_AssignedIssuesQuery
   * @returns parsed response from User_AssignedIssuesQuery
   */
  public async fetch(variables?: Omit<L.User_AssignedIssuesQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.User_AssignedIssuesQuery, L.User_AssignedIssuesQueryVariables>(
      L.User_AssignedIssuesDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.user.assignedIssues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable User_CreatedIssues Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to user
 * @param variables - variables without 'id' to pass into the User_CreatedIssuesQuery
 */
export class User_CreatedIssuesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.User_CreatedIssuesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.User_CreatedIssuesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the User_CreatedIssues query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the User_CreatedIssuesQuery
   * @returns parsed response from User_CreatedIssuesQuery
   */
  public async fetch(variables?: Omit<L.User_CreatedIssuesQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.User_CreatedIssuesQuery, L.User_CreatedIssuesQueryVariables>(
      L.User_CreatedIssuesDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.user.createdIssues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable User_TeamMemberships Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to user
 * @param variables - variables without 'id' to pass into the User_TeamMembershipsQuery
 */
export class User_TeamMembershipsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.User_TeamMembershipsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.User_TeamMembershipsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the User_TeamMemberships query and return a TeamMembershipConnection
   *
   * @param variables - variables without 'id' to pass into the User_TeamMembershipsQuery
   * @returns parsed response from User_TeamMembershipsQuery
   */
  public async fetch(
    variables?: Omit<L.User_TeamMembershipsQueryVariables, "id">
  ): LinearFetch<TeamMembershipConnection> {
    const response = await this._request<L.User_TeamMembershipsQuery, L.User_TeamMembershipsQueryVariables>(
      L.User_TeamMembershipsDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.user.teamMemberships;
    return new TeamMembershipConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable User_Teams Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to user
 * @param variables - variables without 'id' to pass into the User_TeamsQuery
 */
export class User_TeamsQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.User_TeamsQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.User_TeamsQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the User_Teams query and return a TeamConnection
   *
   * @param variables - variables without 'id' to pass into the User_TeamsQuery
   * @returns parsed response from User_TeamsQuery
   */
  public async fetch(variables?: Omit<L.User_TeamsQueryVariables, "id">): LinearFetch<TeamConnection> {
    const response = await this._request<L.User_TeamsQuery, L.User_TeamsQueryVariables>(L.User_TeamsDocument, {
      id: this._id,
      ...this._variables,
      ...variables,
    });
    const data = response.user.teams;
    return new TeamConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Viewer_AssignedIssues Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Viewer_AssignedIssuesQuery
 */
export class Viewer_AssignedIssuesQuery extends Request {
  private _variables?: L.Viewer_AssignedIssuesQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Viewer_AssignedIssuesQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Viewer_AssignedIssues query and return a IssueConnection
   *
   * @param variables - variables to pass into the Viewer_AssignedIssuesQuery
   * @returns parsed response from Viewer_AssignedIssuesQuery
   */
  public async fetch(variables?: L.Viewer_AssignedIssuesQueryVariables): LinearFetch<IssueConnection> {
    const response = await this._request<L.Viewer_AssignedIssuesQuery, L.Viewer_AssignedIssuesQueryVariables>(
      L.Viewer_AssignedIssuesDocument,
      variables
    );
    const data = response.viewer.assignedIssues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Viewer_CreatedIssues Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Viewer_CreatedIssuesQuery
 */
export class Viewer_CreatedIssuesQuery extends Request {
  private _variables?: L.Viewer_CreatedIssuesQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Viewer_CreatedIssuesQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Viewer_CreatedIssues query and return a IssueConnection
   *
   * @param variables - variables to pass into the Viewer_CreatedIssuesQuery
   * @returns parsed response from Viewer_CreatedIssuesQuery
   */
  public async fetch(variables?: L.Viewer_CreatedIssuesQueryVariables): LinearFetch<IssueConnection> {
    const response = await this._request<L.Viewer_CreatedIssuesQuery, L.Viewer_CreatedIssuesQueryVariables>(
      L.Viewer_CreatedIssuesDocument,
      variables
    );
    const data = response.viewer.createdIssues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Viewer_TeamMemberships Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Viewer_TeamMembershipsQuery
 */
export class Viewer_TeamMembershipsQuery extends Request {
  private _variables?: L.Viewer_TeamMembershipsQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Viewer_TeamMembershipsQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Viewer_TeamMemberships query and return a TeamMembershipConnection
   *
   * @param variables - variables to pass into the Viewer_TeamMembershipsQuery
   * @returns parsed response from Viewer_TeamMembershipsQuery
   */
  public async fetch(variables?: L.Viewer_TeamMembershipsQueryVariables): LinearFetch<TeamMembershipConnection> {
    const response = await this._request<L.Viewer_TeamMembershipsQuery, L.Viewer_TeamMembershipsQueryVariables>(
      L.Viewer_TeamMembershipsDocument,
      variables
    );
    const data = response.viewer.teamMemberships;
    return new TeamMembershipConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable Viewer_Teams Query
 *
 * @param request - function to call the graphql client
 * @param variables - variables to pass into the Viewer_TeamsQuery
 */
export class Viewer_TeamsQuery extends Request {
  private _variables?: L.Viewer_TeamsQueryVariables;

  public constructor(request: LinearRequest, variables?: L.Viewer_TeamsQueryVariables) {
    super(request);

    this._variables = variables;
  }

  /**
   * Call the Viewer_Teams query and return a TeamConnection
   *
   * @param variables - variables to pass into the Viewer_TeamsQuery
   * @returns parsed response from Viewer_TeamsQuery
   */
  public async fetch(variables?: L.Viewer_TeamsQueryVariables): LinearFetch<TeamConnection> {
    const response = await this._request<L.Viewer_TeamsQuery, L.Viewer_TeamsQueryVariables>(
      L.Viewer_TeamsDocument,
      variables
    );
    const data = response.viewer.teams;
    return new TeamConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * A fetchable WorkflowState_Issues Query
 *
 * @param request - function to call the graphql client
 * @param id - required id to pass to workflowState
 * @param variables - variables without 'id' to pass into the WorkflowState_IssuesQuery
 */
export class WorkflowState_IssuesQuery extends Request {
  private _id: string;
  private _variables?: Omit<L.WorkflowState_IssuesQueryVariables, "id">;

  public constructor(request: LinearRequest, id: string, variables?: Omit<L.WorkflowState_IssuesQueryVariables, "id">) {
    super(request);
    this._id = id;
    this._variables = variables;
  }

  /**
   * Call the WorkflowState_Issues query and return a IssueConnection
   *
   * @param variables - variables without 'id' to pass into the WorkflowState_IssuesQuery
   * @returns parsed response from WorkflowState_IssuesQuery
   */
  public async fetch(variables?: Omit<L.WorkflowState_IssuesQueryVariables, "id">): LinearFetch<IssueConnection> {
    const response = await this._request<L.WorkflowState_IssuesQuery, L.WorkflowState_IssuesQueryVariables>(
      L.WorkflowState_IssuesDocument,
      {
        id: this._id,
        ...this._variables,
        ...variables,
      }
    );
    const data = response.workflowState.issues;
    return new IssueConnection(
      this._request,
      connection =>
        this.fetch(
          defaultConnection({
            ...this._variables,
            ...variables,
            ...connection,
          })
        ),
      data
    );
  }
}

/**
 * The SDK class containing all root operations
 *
 * @param request - function to call the graphql client
 */
export class LinearSdk extends Request {
  public constructor(request: LinearRequest) {
    super(request);
  }

  /**
   * All teams you the user can administrate. Administrable teams are teams whose settings the user can change, but to whose issues the user doesn't necessarily have access to.
   *
   * @param variables - variables to pass into the AdministrableTeamsQuery
   * @returns TeamConnection
   */
  public administrableTeams(variables?: L.AdministrableTeamsQueryVariables): LinearFetch<TeamConnection> {
    return new AdministrableTeamsQuery(this._request).fetch(variables);
  }
  /**
   * Get information for an application and whether a user has approved it for the given scopes.
   *
   * @param clientId - required clientId to pass to applicationWithAuthorization
   * @param scope - required scope to pass to applicationWithAuthorization
   * @param variables - variables without 'clientId', 'scope' to pass into the ApplicationWithAuthorizationQuery
   * @returns UserAuthorizedApplication
   */
  public applicationWithAuthorization(
    clientId: string,
    scope: string[],
    variables?: Omit<L.ApplicationWithAuthorizationQueryVariables, "clientId" | "scope">
  ): LinearFetch<UserAuthorizedApplication> {
    return new ApplicationWithAuthorizationQuery(this._request).fetch(clientId, scope, variables);
  }
  /**
   * [Alpha] One specific issue attachment.
   * [Deprecated] 'url' can no longer be used as the 'id' parameter. Use 'attachmentsForUrl' instead
   *
   * @param id - required id to pass to attachment
   * @returns Attachment
   */
  public attachment(id: string): LinearFetch<Attachment> {
    return new AttachmentQuery(this._request).fetch(id);
  }
  /**
   * [Alpha] Query an issue by its associated attachment, and its id.
   *
   * @param id - required id to pass to attachmentIssue
   * @returns Issue
   */
  public attachmentIssue(id: string): LinearFetch<Issue> {
    return new AttachmentIssueQuery(this._request).fetch(id);
  }
  /**
   * [Alpha] All issue attachments.
   *
   * To get attachments for a given URL, use `attachmentsForURL` query.
   *
   * @param variables - variables to pass into the AttachmentsQuery
   * @returns AttachmentConnection
   */
  public attachments(variables?: L.AttachmentsQueryVariables): LinearFetch<AttachmentConnection> {
    return new AttachmentsQuery(this._request).fetch(variables);
  }
  /**
   * [Alpha] Returns issue attachments for a given `url`.
   *
   * @param url - required url to pass to attachmentsForURL
   * @param variables - variables without 'url' to pass into the AttachmentsForUrlQuery
   * @returns AttachmentConnection
   */
  public attachmentsForURL(
    url: string,
    variables?: Omit<L.AttachmentsForUrlQueryVariables, "url">
  ): LinearFetch<AttachmentConnection> {
    return new AttachmentsForUrlQuery(this._request).fetch(url, variables);
  }
  /**
   * All audit log entries.
   *
   * @param variables - variables to pass into the AuditEntriesQuery
   * @returns AuditEntryConnection
   */
  public auditEntries(variables?: L.AuditEntriesQueryVariables): LinearFetch<AuditEntryConnection> {
    return new AuditEntriesQuery(this._request).fetch(variables);
  }
  /**
   * List of audit entry types.
   *
   * @returns AuditEntryType[]
   */
  public get auditEntryTypes(): LinearFetch<AuditEntryType[]> {
    return new AuditEntryTypesQuery(this._request).fetch();
  }
  /**
   * Get all authorized applications for a user
   *
   * @returns AuthorizedApplication[]
   */
  public get authorizedApplications(): LinearFetch<AuthorizedApplication[]> {
    return new AuthorizedApplicationsQuery(this._request).fetch();
  }
  /**
   * Fetch users belonging to this user account.
   *
   * @returns AuthResolverResponse
   */
  public get availableUsers(): LinearFetch<AuthResolverResponse> {
    return new AvailableUsersQuery(this._request).fetch();
  }
  /**
   * Billing details for the customer.
   *
   * @returns BillingDetailsPayload
   */
  public get billingDetails(): LinearFetch<BillingDetailsPayload> {
    return new BillingDetailsQuery(this._request).fetch();
  }
  /**
   * Join collaborative document and get missing steps.
   *
   * @param clientId - required clientId to pass to collaborativeDocumentJoin
   * @param issueId - required issueId to pass to collaborativeDocumentJoin
   * @param version - required version to pass to collaborativeDocumentJoin
   * @returns CollaborationDocumentUpdatePayload
   */
  public collaborativeDocumentJoin(
    clientId: string,
    issueId: string,
    version: number
  ): LinearFetch<CollaborationDocumentUpdatePayload> {
    return new CollaborativeDocumentJoinQuery(this._request).fetch(clientId, issueId, version);
  }
  /**
   * A specific comment.
   *
   * @param id - required id to pass to comment
   * @returns Comment
   */
  public comment(id: string): LinearFetch<Comment> {
    return new CommentQuery(this._request).fetch(id);
  }
  /**
   * All comments.
   *
   * @param variables - variables to pass into the CommentsQuery
   * @returns CommentConnection
   */
  public comments(variables?: L.CommentsQueryVariables): LinearFetch<CommentConnection> {
    return new CommentsQuery(this._request).fetch(variables);
  }
  /**
   * One specific custom view.
   *
   * @param id - required id to pass to customView
   * @returns CustomView
   */
  public customView(id: string): LinearFetch<CustomView> {
    return new CustomViewQuery(this._request).fetch(id);
  }
  /**
   * Custom views for the user.
   *
   * @param variables - variables to pass into the CustomViewsQuery
   * @returns CustomViewConnection
   */
  public customViews(variables?: L.CustomViewsQueryVariables): LinearFetch<CustomViewConnection> {
    return new CustomViewsQuery(this._request).fetch(variables);
  }
  /**
   * One specific cycle.
   *
   * @param id - required id to pass to cycle
   * @returns Cycle
   */
  public cycle(id: string): LinearFetch<Cycle> {
    return new CycleQuery(this._request).fetch(id);
  }
  /**
   * All cycles.
   *
   * @param variables - variables to pass into the CyclesQuery
   * @returns CycleConnection
   */
  public cycles(variables?: L.CyclesQueryVariables): LinearFetch<CycleConnection> {
    return new CyclesQuery(this._request).fetch(variables);
  }
  /**
   * One specific document.
   *
   * @param id - required id to pass to document
   * @returns Document
   */
  public document(id: string): LinearFetch<Document> {
    return new DocumentQuery(this._request).fetch(id);
  }
  /**
   * All documents for the project.
   *
   * @param variables - variables to pass into the DocumentsQuery
   * @returns DocumentConnection
   */
  public documents(variables?: L.DocumentsQueryVariables): LinearFetch<DocumentConnection> {
    return new DocumentsQuery(this._request).fetch(variables);
  }
  /**
   * A specific emoji.
   *
   * @param id - required id to pass to emoji
   * @returns Emoji
   */
  public emoji(id: string): LinearFetch<Emoji> {
    return new EmojiQuery(this._request).fetch(id);
  }
  /**
   * All custom emojis.
   *
   * @param variables - variables to pass into the EmojisQuery
   * @returns EmojiConnection
   */
  public emojis(variables?: L.EmojisQueryVariables): LinearFetch<EmojiConnection> {
    return new EmojisQuery(this._request).fetch(variables);
  }
  /**
   * One specific favorite.
   *
   * @param id - required id to pass to favorite
   * @returns Favorite
   */
  public favorite(id: string): LinearFetch<Favorite> {
    return new FavoriteQuery(this._request).fetch(id);
  }
  /**
   * The user's favorites.
   *
   * @param variables - variables to pass into the FavoritesQuery
   * @returns FavoriteConnection
   */
  public favorites(variables?: L.FavoritesQueryVariables): LinearFetch<FavoriteConnection> {
    return new FavoritesQuery(this._request).fetch(variables);
  }
  /**
   * Fetch Figma screenshot and other information with file and node identifiers.
   *
   * @param fileId - required fileId to pass to figmaEmbedInfo
   * @param variables - variables without 'fileId' to pass into the FigmaEmbedInfoQuery
   * @returns FigmaEmbedPayload
   */
  public figmaEmbedInfo(
    fileId: string,
    variables?: Omit<L.FigmaEmbedInfoQueryVariables, "fileId">
  ): LinearFetch<FigmaEmbedPayload> {
    return new FigmaEmbedInfoQuery(this._request).fetch(fileId, variables);
  }
  /**
   * One specific integration.
   *
   * @param id - required id to pass to integration
   * @returns Integration
   */
  public integration(id: string): LinearFetch<Integration> {
    return new IntegrationQuery(this._request).fetch(id);
  }
  /**
   * All integrations.
   *
   * @param variables - variables to pass into the IntegrationsQuery
   * @returns IntegrationConnection
   */
  public integrations(variables?: L.IntegrationsQueryVariables): LinearFetch<IntegrationConnection> {
    return new IntegrationsQuery(this._request).fetch(variables);
  }
  /**
   * One specific issue.
   *
   * @param id - required id to pass to issue
   * @returns Issue
   */
  public issue(id: string): LinearFetch<Issue> {
    return new IssueQuery(this._request).fetch(id);
  }
  /**
   * Fetches the GitHub token, completing the OAuth flow.
   *
   * @param code - required code to pass to issueImportFinishGithubOAuth
   * @returns GithubOAuthTokenPayload
   */
  public issueImportFinishGithubOAuth(code: string): LinearFetch<GithubOAuthTokenPayload> {
    return new IssueImportFinishGithubOAuthQuery(this._request).fetch(code);
  }
  /**
   * One specific label.
   *
   * @param id - required id to pass to issueLabel
   * @returns IssueLabel
   */
  public issueLabel(id: string): LinearFetch<IssueLabel> {
    return new IssueLabelQuery(this._request).fetch(id);
  }
  /**
   * All issue labels.
   *
   * @param variables - variables to pass into the IssueLabelsQuery
   * @returns IssueLabelConnection
   */
  public issueLabels(variables?: L.IssueLabelsQueryVariables): LinearFetch<IssueLabelConnection> {
    return new IssueLabelsQuery(this._request).fetch(variables);
  }
  /**
   * Issue priority values and corresponding labels.
   *
   * @returns IssuePriorityValue[]
   */
  public get issuePriorityValues(): LinearFetch<IssuePriorityValue[]> {
    return new IssuePriorityValuesQuery(this._request).fetch();
  }
  /**
   * One specific issue relation.
   *
   * @param id - required id to pass to issueRelation
   * @returns IssueRelation
   */
  public issueRelation(id: string): LinearFetch<IssueRelation> {
    return new IssueRelationQuery(this._request).fetch(id);
  }
  /**
   * All issue relationships.
   *
   * @param variables - variables to pass into the IssueRelationsQuery
   * @returns IssueRelationConnection
   */
  public issueRelations(variables?: L.IssueRelationsQueryVariables): LinearFetch<IssueRelationConnection> {
    return new IssueRelationsQuery(this._request).fetch(variables);
  }
  /**
   * [ALPHA] Search issues. This query is experimental and is subject to change without notice.
   *
   * @param query - required query to pass to issueSearch
   * @param variables - variables without 'query' to pass into the IssueSearchQuery
   * @returns IssueConnection
   */
  public issueSearch(
    query: string,
    variables?: Omit<L.IssueSearchQueryVariables, "query">
  ): LinearFetch<IssueConnection> {
    return new IssueSearchQuery(this._request).fetch(query, variables);
  }
  /**
   * All issues.
   *
   * @param variables - variables to pass into the IssuesQuery
   * @returns IssueConnection
   */
  public issues(variables?: L.IssuesQueryVariables): LinearFetch<IssueConnection> {
    return new IssuesQuery(this._request).fetch(variables);
  }
  /**
   * One specific milestone.
   *
   * @param id - required id to pass to milestone
   * @returns Milestone
   */
  public milestone(id: string): LinearFetch<Milestone> {
    return new MilestoneQuery(this._request).fetch(id);
  }
  /**
   * All milestones.
   *
   * @param variables - variables to pass into the MilestonesQuery
   * @returns MilestoneConnection
   */
  public milestones(variables?: L.MilestonesQueryVariables): LinearFetch<MilestoneConnection> {
    return new MilestonesQuery(this._request).fetch(variables);
  }
  /**
   * One specific notification.
   *
   * @param id - required id to pass to notification
   * @returns Notification
   */
  public notification(id: string): LinearFetch<Notification> {
    return new NotificationQuery(this._request).fetch(id);
  }
  /**
   * One specific notification subscription.
   *
   * @param id - required id to pass to notificationSubscription
   * @returns NotificationSubscription
   */
  public notificationSubscription(id: string): LinearFetch<NotificationSubscription> {
    return new NotificationSubscriptionQuery(this._request).fetch(id);
  }
  /**
   * The user's notification subscriptions.
   *
   * @param variables - variables to pass into the NotificationSubscriptionsQuery
   * @returns NotificationSubscriptionConnection
   */
  public notificationSubscriptions(
    variables?: L.NotificationSubscriptionsQueryVariables
  ): LinearFetch<NotificationSubscriptionConnection> {
    return new NotificationSubscriptionsQuery(this._request).fetch(variables);
  }
  /**
   * All notifications.
   *
   * @param variables - variables to pass into the NotificationsQuery
   * @returns NotificationConnection
   */
  public notifications(variables?: L.NotificationsQueryVariables): LinearFetch<NotificationConnection> {
    return new NotificationsQuery(this._request).fetch(variables);
  }
  /**
   * The user's organization.
   *
   * @returns Organization
   */
  public get organization(): LinearFetch<Organization> {
    return new OrganizationQuery(this._request).fetch();
  }
  /**
   * Does the organization exist.
   *
   * @param urlKey - required urlKey to pass to organizationExists
   * @returns OrganizationExistsPayload
   */
  public organizationExists(urlKey: string): LinearFetch<OrganizationExistsPayload> {
    return new OrganizationExistsQuery(this._request).fetch(urlKey);
  }
  /**
   * One specific organization invite.
   *
   * @param id - required id to pass to organizationInvite
   * @returns OrganizationInvite
   */
  public organizationInvite(id: string): LinearFetch<OrganizationInvite> {
    return new OrganizationInviteQuery(this._request).fetch(id);
  }
  /**
   * One specific organization invite.
   *
   * @param id - required id to pass to organizationInviteDetails
   * @returns OrganizationInviteDetailsPayload
   */
  public organizationInviteDetails(id: string): LinearFetch<OrganizationInviteDetailsPayload> {
    return new OrganizationInviteDetailsQuery(this._request).fetch(id);
  }
  /**
   * All invites for the organization.
   *
   * @param variables - variables to pass into the OrganizationInvitesQuery
   * @returns OrganizationInviteConnection
   */
  public organizationInvites(
    variables?: L.OrganizationInvitesQueryVariables
  ): LinearFetch<OrganizationInviteConnection> {
    return new OrganizationInvitesQuery(this._request).fetch(variables);
  }
  /**
   * One specific project.
   *
   * @param id - required id to pass to project
   * @returns Project
   */
  public project(id: string): LinearFetch<Project> {
    return new ProjectQuery(this._request).fetch(id);
  }
  /**
   * One specific project link.
   *
   * @param id - required id to pass to projectLink
   * @returns ProjectLink
   */
  public projectLink(id: string): LinearFetch<ProjectLink> {
    return new ProjectLinkQuery(this._request).fetch(id);
  }
  /**
   * All links for the project.
   *
   * @param variables - variables to pass into the ProjectLinksQuery
   * @returns ProjectLinkConnection
   */
  public projectLinks(variables?: L.ProjectLinksQueryVariables): LinearFetch<ProjectLinkConnection> {
    return new ProjectLinksQuery(this._request).fetch(variables);
  }
  /**
   * All projects.
   *
   * @param variables - variables to pass into the ProjectsQuery
   * @returns ProjectConnection
   */
  public projects(variables?: L.ProjectsQueryVariables): LinearFetch<ProjectConnection> {
    return new ProjectsQuery(this._request).fetch(variables);
  }
  /**
   * Sends a test push message.
   *
   * @returns PushSubscriptionTestPayload
   */
  public get pushSubscriptionTest(): LinearFetch<PushSubscriptionTestPayload> {
    return new PushSubscriptionTestQuery(this._request).fetch();
  }
  /**
   * A specific reaction.
   *
   * @param id - required id to pass to reaction
   * @returns Reaction
   */
  public reaction(id: string): LinearFetch<Reaction> {
    return new ReactionQuery(this._request).fetch(id);
  }
  /**
   * All comment emoji reactions.
   *
   * @param variables - variables to pass into the ReactionsQuery
   * @returns ReactionConnection
   */
  public reactions(variables?: L.ReactionsQueryVariables): LinearFetch<ReactionConnection> {
    return new ReactionsQuery(this._request).fetch(variables);
  }
  /**
   * Fetch SSO login URL for the email provided.
   *
   * @param email - required email to pass to ssoUrlFromEmail
   * @param variables - variables without 'email' to pass into the SsoUrlFromEmailQuery
   * @returns SsoUrlFromEmailResponse
   */
  public ssoUrlFromEmail(
    email: string,
    variables?: Omit<L.SsoUrlFromEmailQueryVariables, "email">
  ): LinearFetch<SsoUrlFromEmailResponse> {
    return new SsoUrlFromEmailQuery(this._request).fetch(email, variables);
  }
  /**
   * The organization's subscription.
   *
   * @returns Subscription
   */
  public get subscription(): LinearFetch<Subscription | undefined> {
    return new SubscriptionQuery(this._request).fetch();
  }
  /**
   * One specific team.
   *
   * @param id - required id to pass to team
   * @returns Team
   */
  public team(id: string): LinearFetch<Team> {
    return new TeamQuery(this._request).fetch(id);
  }
  /**
   * One specific team membership.
   *
   * @param id - required id to pass to teamMembership
   * @returns TeamMembership
   */
  public teamMembership(id: string): LinearFetch<TeamMembership> {
    return new TeamMembershipQuery(this._request).fetch(id);
  }
  /**
   * All team memberships.
   *
   * @param variables - variables to pass into the TeamMembershipsQuery
   * @returns TeamMembershipConnection
   */
  public teamMemberships(variables?: L.TeamMembershipsQueryVariables): LinearFetch<TeamMembershipConnection> {
    return new TeamMembershipsQuery(this._request).fetch(variables);
  }
  /**
   * All teams whose issues can be accessed by the user. This might be different from `administrableTeams`, which also includes teams whose settings can be changed by the user.
   *
   * @param variables - variables to pass into the TeamsQuery
   * @returns TeamConnection
   */
  public teams(variables?: L.TeamsQueryVariables): LinearFetch<TeamConnection> {
    return new TeamsQuery(this._request).fetch(variables);
  }
  /**
   * A specific template.
   *
   * @param id - required id to pass to template
   * @returns Template
   */
  public template(id: string): LinearFetch<Template> {
    return new TemplateQuery(this._request).fetch(id);
  }
  /**
   * All templates from all users.
   *
   * @returns Template[]
   */
  public get templates(): LinearFetch<Template[]> {
    return new TemplatesQuery(this._request).fetch();
  }
  /**
   * One specific user.
   *
   * @param id - required id to pass to user
   * @returns User
   */
  public user(id: string): LinearFetch<User> {
    return new UserQuery(this._request).fetch(id);
  }
  /**
   * The user's settings.
   *
   * @returns UserSettings
   */
  public get userSettings(): LinearFetch<UserSettings> {
    return new UserSettingsQuery(this._request).fetch();
  }
  /**
   * All users for the organization.
   *
   * @param variables - variables to pass into the UsersQuery
   * @returns UserConnection
   */
  public users(variables?: L.UsersQueryVariables): LinearFetch<UserConnection> {
    return new UsersQuery(this._request).fetch(variables);
  }
  /**
   * The currently authenticated user.
   *
   * @returns User
   */
  public get viewer(): LinearFetch<User> {
    return new ViewerQuery(this._request).fetch();
  }
  /**
   * A specific webhook.
   *
   * @param id - required id to pass to webhook
   * @returns Webhook
   */
  public webhook(id: string): LinearFetch<Webhook> {
    return new WebhookQuery(this._request).fetch(id);
  }
  /**
   * All webhooks.
   *
   * @param variables - variables to pass into the WebhooksQuery
   * @returns WebhookConnection
   */
  public webhooks(variables?: L.WebhooksQueryVariables): LinearFetch<WebhookConnection> {
    return new WebhooksQuery(this._request).fetch(variables);
  }
  /**
   * One specific state.
   *
   * @param id - required id to pass to workflowState
   * @returns WorkflowState
   */
  public workflowState(id: string): LinearFetch<WorkflowState> {
    return new WorkflowStateQuery(this._request).fetch(id);
  }
  /**
   * All issue workflow states.
   *
   * @param variables - variables to pass into the WorkflowStatesQuery
   * @returns WorkflowStateConnection
   */
  public workflowStates(variables?: L.WorkflowStatesQueryVariables): LinearFetch<WorkflowStateConnection> {
    return new WorkflowStatesQuery(this._request).fetch(variables);
  }
  /**
   * [DEPRECATED] Archives an issue attachment.
   *
   * @param id - required id to pass to attachmentArchive
   * @returns ArchivePayload
   */
  public attachmentArchive(id: string): LinearFetch<ArchivePayload> {
    return new AttachmentArchiveMutation(this._request).fetch(id);
  }
  /**
   * [Alpha] Creates a new attachment, or updates existing if the same `url` and `issueId` is used.
   *
   * @param input - required input to pass to attachmentCreate
   * @returns AttachmentPayload
   */
  public attachmentCreate(input: L.AttachmentCreateInput): LinearFetch<AttachmentPayload> {
    return new AttachmentCreateMutation(this._request).fetch(input);
  }
  /**
   * [Alpha] Deletes an issue attachment.
   *
   * @param id - required id to pass to attachmentDelete
   * @returns ArchivePayload
   */
  public attachmentDelete(id: string): LinearFetch<ArchivePayload> {
    return new AttachmentDeleteMutation(this._request).fetch(id);
  }
  /**
   * Link an existing Front conversation to an issue.
   *
   * @param conversationId - required conversationId to pass to attachmentLinkFront
   * @param issueId - required issueId to pass to attachmentLinkFront
   * @returns FrontAttachmentPayload
   */
  public attachmentLinkFront(conversationId: string, issueId: string): LinearFetch<FrontAttachmentPayload> {
    return new AttachmentLinkFrontMutation(this._request).fetch(conversationId, issueId);
  }
  /**
   * Link an existing Intercom conversation to an issue.
   *
   * @param conversationId - required conversationId to pass to attachmentLinkIntercom
   * @param issueId - required issueId to pass to attachmentLinkIntercom
   * @returns AttachmentPayload
   */
  public attachmentLinkIntercom(conversationId: string, issueId: string): LinearFetch<AttachmentPayload> {
    return new AttachmentLinkIntercomMutation(this._request).fetch(conversationId, issueId);
  }
  /**
   * Link any url to an issue.
   *
   * @param issueId - required issueId to pass to attachmentLinkURL
   * @param url - required url to pass to attachmentLinkURL
   * @param variables - variables without 'issueId', 'url' to pass into the AttachmentLinkUrlMutation
   * @returns AttachmentPayload
   */
  public attachmentLinkURL(
    issueId: string,
    url: string,
    variables?: Omit<L.AttachmentLinkUrlMutationVariables, "issueId" | "url">
  ): LinearFetch<AttachmentPayload> {
    return new AttachmentLinkUrlMutation(this._request).fetch(issueId, url, variables);
  }
  /**
   * Link an existing Zendesk ticket to an issue.
   *
   * @param issueId - required issueId to pass to attachmentLinkZendesk
   * @param ticketId - required ticketId to pass to attachmentLinkZendesk
   * @returns AttachmentPayload
   */
  public attachmentLinkZendesk(issueId: string, ticketId: string): LinearFetch<AttachmentPayload> {
    return new AttachmentLinkZendeskMutation(this._request).fetch(issueId, ticketId);
  }
  /**
   * [Alpha] Updates an existing issue attachment.
   *
   * @param id - required id to pass to attachmentUpdate
   * @param input - required input to pass to attachmentUpdate
   * @returns AttachmentPayload
   */
  public attachmentUpdate(id: string, input: L.AttachmentUpdateInput): LinearFetch<AttachmentPayload> {
    return new AttachmentUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Updates the billing email address for the customer.
   *
   * @param input - required input to pass to billingEmailUpdate
   * @returns BillingEmailPayload
   */
  public billingEmailUpdate(input: L.BillingEmailUpdateInput): LinearFetch<BillingEmailPayload> {
    return new BillingEmailUpdateMutation(this._request).fetch(input);
  }
  /**
   * Update collaborative document with client steps.
   *
   * @param input - required input to pass to collaborativeDocumentUpdate
   * @returns CollaborationDocumentUpdatePayload
   */
  public collaborativeDocumentUpdate(
    input: L.CollaborationDocumentUpdateInput
  ): LinearFetch<CollaborationDocumentUpdatePayload> {
    return new CollaborativeDocumentUpdateMutation(this._request).fetch(input);
  }
  /**
   * Creates a new comment.
   *
   * @param input - required input to pass to commentCreate
   * @returns CommentPayload
   */
  public commentCreate(input: L.CommentCreateInput): LinearFetch<CommentPayload> {
    return new CommentCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a comment.
   *
   * @param id - required id to pass to commentDelete
   * @returns ArchivePayload
   */
  public commentDelete(id: string): LinearFetch<ArchivePayload> {
    return new CommentDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates a comment.
   *
   * @param id - required id to pass to commentUpdate
   * @param input - required input to pass to commentUpdate
   * @returns CommentPayload
   */
  public commentUpdate(id: string, input: L.CommentUpdateInput): LinearFetch<CommentPayload> {
    return new CommentUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Saves user message.
   *
   * @param input - required input to pass to contactCreate
   * @returns ContactPayload
   */
  public contactCreate(input: L.ContactCreateInput): LinearFetch<ContactPayload> {
    return new ContactCreateMutation(this._request).fetch(input);
  }
  /**
   * Create CSV export report for the organization.
   *
   * @param variables - variables to pass into the CreateCsvExportReportMutation
   * @returns CreateCsvExportReportPayload
   */
  public createCsvExportReport(
    variables?: L.CreateCsvExportReportMutationVariables
  ): LinearFetch<CreateCsvExportReportPayload> {
    return new CreateCsvExportReportMutation(this._request).fetch(variables);
  }
  /**
   * Creates an organization from onboarding.
   *
   * @param input - required input to pass to createOrganizationFromOnboarding
   * @param variables - variables without 'input' to pass into the CreateOrganizationFromOnboardingMutation
   * @returns CreateOrJoinOrganizationResponse
   */
  public createOrganizationFromOnboarding(
    input: L.CreateOrganizationInput,
    variables?: Omit<L.CreateOrganizationFromOnboardingMutationVariables, "input">
  ): LinearFetch<CreateOrJoinOrganizationResponse> {
    return new CreateOrganizationFromOnboardingMutation(this._request).fetch(input, variables);
  }
  /**
   * Creates a new custom view.
   *
   * @param input - required input to pass to customViewCreate
   * @returns CustomViewPayload
   */
  public customViewCreate(input: L.CustomViewCreateInput): LinearFetch<CustomViewPayload> {
    return new CustomViewCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a custom view.
   *
   * @param id - required id to pass to customViewDelete
   * @returns ArchivePayload
   */
  public customViewDelete(id: string): LinearFetch<ArchivePayload> {
    return new CustomViewDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates a custom view.
   *
   * @param id - required id to pass to customViewUpdate
   * @param input - required input to pass to customViewUpdate
   * @returns CustomViewPayload
   */
  public customViewUpdate(id: string, input: L.CustomViewUpdateInput): LinearFetch<CustomViewPayload> {
    return new CustomViewUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Archives a cycle.
   *
   * @param id - required id to pass to cycleArchive
   * @returns ArchivePayload
   */
  public cycleArchive(id: string): LinearFetch<ArchivePayload> {
    return new CycleArchiveMutation(this._request).fetch(id);
  }
  /**
   * Creates a new cycle.
   *
   * @param input - required input to pass to cycleCreate
   * @returns CyclePayload
   */
  public cycleCreate(input: L.CycleCreateInput): LinearFetch<CyclePayload> {
    return new CycleCreateMutation(this._request).fetch(input);
  }
  /**
   * Updates a cycle.
   *
   * @param id - required id to pass to cycleUpdate
   * @param input - required input to pass to cycleUpdate
   * @returns CyclePayload
   */
  public cycleUpdate(id: string, input: L.CycleUpdateInput): LinearFetch<CyclePayload> {
    return new CycleUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Create the OAuth test applications in development.
   *
   * @returns DebugPayload
   */
  public get debugCreateOAuthApps(): LinearFetch<DebugPayload> {
    return new DebugCreateOAuthAppsMutation(this._request).fetch();
  }
  /**
   * Create the SAML test organization in development.
   *
   * @returns DebugPayload
   */
  public get debugCreateSAMLOrg(): LinearFetch<DebugPayload> {
    return new DebugCreateSamlOrgMutation(this._request).fetch();
  }
  /**
   * Always fails with internal error. Used to debug logging.
   *
   * @returns DebugPayload
   */
  public get debugFailWithInternalError(): LinearFetch<DebugPayload> {
    return new DebugFailWithInternalErrorMutation(this._request).fetch();
  }
  /**
   * Always logs an error to Sentry as warning. Used to debug logging.
   *
   * @returns DebugPayload
   */
  public get debugFailWithWarning(): LinearFetch<DebugPayload> {
    return new DebugFailWithWarningMutation(this._request).fetch();
  }
  /**
   * Creates a new document.
   *
   * @param input - required input to pass to documentCreate
   * @returns DocumentPayload
   */
  public documentCreate(input: L.DocumentCreateInput): LinearFetch<DocumentPayload> {
    return new DocumentCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a document.
   *
   * @param id - required id to pass to documentDelete
   * @returns ArchivePayload
   */
  public documentDelete(id: string): LinearFetch<ArchivePayload> {
    return new DocumentDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates a document.
   *
   * @param id - required id to pass to documentUpdate
   * @param input - required input to pass to documentUpdate
   * @returns DocumentPayload
   */
  public documentUpdate(id: string, input: L.DocumentUpdateInput): LinearFetch<DocumentPayload> {
    return new DocumentUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Subscribes the email to the newsletter.
   *
   * @param input - required input to pass to emailSubscribe
   * @returns EmailSubscribePayload
   */
  public emailSubscribe(input: L.EmailSubscribeInput): LinearFetch<EmailSubscribePayload> {
    return new EmailSubscribeMutation(this._request).fetch(input);
  }
  /**
   * Authenticates a user account via email and authentication token.
   *
   * @param input - required input to pass to emailTokenUserAccountAuth
   * @returns AuthResolverResponse
   */
  public emailTokenUserAccountAuth(input: L.TokenUserAccountAuthInput): LinearFetch<AuthResolverResponse> {
    return new EmailTokenUserAccountAuthMutation(this._request).fetch(input);
  }
  /**
   * Unsubscribes the user from one type of emails.
   *
   * @param input - required input to pass to emailUnsubscribe
   * @returns EmailUnsubscribePayload
   */
  public emailUnsubscribe(input: L.EmailUnsubscribeInput): LinearFetch<EmailUnsubscribePayload> {
    return new EmailUnsubscribeMutation(this._request).fetch(input);
  }
  /**
   * Finds or creates a new user account by email and sends an email with token.
   *
   * @param input - required input to pass to emailUserAccountAuthChallenge
   * @returns EmailUserAccountAuthChallengeResponse
   */
  public emailUserAccountAuthChallenge(
    input: L.EmailUserAccountAuthChallengeInput
  ): LinearFetch<EmailUserAccountAuthChallengeResponse> {
    return new EmailUserAccountAuthChallengeMutation(this._request).fetch(input);
  }
  /**
   * Creates a custom emoji.
   *
   * @param input - required input to pass to emojiCreate
   * @returns EmojiPayload
   */
  public emojiCreate(input: L.EmojiCreateInput): LinearFetch<EmojiPayload> {
    return new EmojiCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes an emoji.
   *
   * @param id - required id to pass to emojiDelete
   * @returns ArchivePayload
   */
  public emojiDelete(id: string): LinearFetch<ArchivePayload> {
    return new EmojiDeleteMutation(this._request).fetch(id);
  }
  /**
   * [Deprecated] Creates a new event.
   *
   * @param input - required input to pass to eventCreate
   * @returns EventPayload
   */
  public eventCreate(input: L.EventCreateInput): LinearFetch<EventPayload> {
    return new EventCreateMutation(this._request).fetch(input);
  }
  /**
   * Creates a new favorite (project, cycle etc).
   *
   * @param input - required input to pass to favoriteCreate
   * @returns FavoritePayload
   */
  public favoriteCreate(input: L.FavoriteCreateInput): LinearFetch<FavoritePayload> {
    return new FavoriteCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a favorite reference.
   *
   * @param id - required id to pass to favoriteDelete
   * @returns ArchivePayload
   */
  public favoriteDelete(id: string): LinearFetch<ArchivePayload> {
    return new FavoriteDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates a favorite.
   *
   * @param id - required id to pass to favoriteUpdate
   * @param input - required input to pass to favoriteUpdate
   * @returns FavoritePayload
   */
  public favoriteUpdate(id: string, input: L.FavoriteUpdateInput): LinearFetch<FavoritePayload> {
    return new FavoriteUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Saves user feedback.
   *
   * @param input - required input to pass to feedbackCreate
   * @returns FeedbackPayload
   */
  public feedbackCreate(input: L.FeedbackCreateInput): LinearFetch<FeedbackPayload> {
    return new FeedbackCreateMutation(this._request).fetch(input);
  }
  /**
   * XHR request payload to upload an images, video and other attachments directly to Linear's cloud storage.
   *
   * @param contentType - required contentType to pass to fileUpload
   * @param filename - required filename to pass to fileUpload
   * @param size - required size to pass to fileUpload
   * @param variables - variables without 'contentType', 'filename', 'size' to pass into the FileUploadMutation
   * @returns UploadPayload
   */
  public fileUpload(
    contentType: string,
    filename: string,
    size: number,
    variables?: Omit<L.FileUploadMutationVariables, "contentType" | "filename" | "size">
  ): LinearFetch<UploadPayload> {
    return new FileUploadMutation(this._request).fetch(contentType, filename, size, variables);
  }
  /**
   * Authenticate user account through Google OAuth. This is the 2nd step of OAuth flow.
   *
   * @param input - required input to pass to googleUserAccountAuth
   * @returns AuthResolverResponse
   */
  public googleUserAccountAuth(input: L.GoogleUserAccountAuthInput): LinearFetch<AuthResolverResponse> {
    return new GoogleUserAccountAuthMutation(this._request).fetch(input);
  }
  /**
   * Upload an image from an URL to Linear.
   *
   * @param url - required url to pass to imageUploadFromUrl
   * @returns ImageUploadFromUrlPayload
   */
  public imageUploadFromUrl(url: string): LinearFetch<ImageUploadFromUrlPayload> {
    return new ImageUploadFromUrlMutation(this._request).fetch(url);
  }
  /**
   * Deletes an integration.
   *
   * @param id - required id to pass to integrationDelete
   * @returns ArchivePayload
   */
  public integrationDelete(id: string): LinearFetch<ArchivePayload> {
    return new IntegrationDeleteMutation(this._request).fetch(id);
  }
  /**
   * Integrates the organization with Figma.
   *
   * @param code - required code to pass to integrationFigma
   * @param redirectUri - required redirectUri to pass to integrationFigma
   * @returns IntegrationPayload
   */
  public integrationFigma(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    return new IntegrationFigmaMutation(this._request).fetch(code, redirectUri);
  }
  /**
   * Integrates the organization with Front.
   *
   * @param code - required code to pass to integrationFront
   * @param redirectUri - required redirectUri to pass to integrationFront
   * @returns IntegrationPayload
   */
  public integrationFront(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    return new IntegrationFrontMutation(this._request).fetch(code, redirectUri);
  }
  /**
   * Connects the organization with the GitHub App.
   *
   * @param installationId - required installationId to pass to integrationGithubConnect
   * @returns IntegrationPayload
   */
  public integrationGithubConnect(installationId: string): LinearFetch<IntegrationPayload> {
    return new IntegrationGithubConnectMutation(this._request).fetch(installationId);
  }
  /**
   * Connects the organization with a GitLab Access Token.
   *
   * @param accessToken - required accessToken to pass to integrationGitlabConnect
   * @param gitlabUrl - required gitlabUrl to pass to integrationGitlabConnect
   * @returns IntegrationPayload
   */
  public integrationGitlabConnect(accessToken: string, gitlabUrl: string): LinearFetch<IntegrationPayload> {
    return new IntegrationGitlabConnectMutation(this._request).fetch(accessToken, gitlabUrl);
  }
  /**
   * Integrates the organization with Google Sheets.
   *
   * @param code - required code to pass to integrationGoogleSheets
   * @returns IntegrationPayload
   */
  public integrationGoogleSheets(code: string): LinearFetch<IntegrationPayload> {
    return new IntegrationGoogleSheetsMutation(this._request).fetch(code);
  }
  /**
   * Integrates the organization with Intercom.
   *
   * @param code - required code to pass to integrationIntercom
   * @param redirectUri - required redirectUri to pass to integrationIntercom
   * @returns IntegrationPayload
   */
  public integrationIntercom(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    return new IntegrationIntercomMutation(this._request).fetch(code, redirectUri);
  }
  /**
   * Disconnects the organization from Intercom.
   *
   * @returns IntegrationPayload
   */
  public get integrationIntercomDelete(): LinearFetch<IntegrationPayload> {
    return new IntegrationIntercomDeleteMutation(this._request).fetch();
  }
  /**
   * Updates settings on the Intercom integration.
   *
   * @param input - required input to pass to integrationIntercomSettingsUpdate
   * @returns IntegrationPayload
   */
  public integrationIntercomSettingsUpdate(input: L.IntercomSettingsInput): LinearFetch<IntegrationPayload> {
    return new IntegrationIntercomSettingsUpdateMutation(this._request).fetch(input);
  }
  /**
   * Updates settings on the Jira integration.
   *
   * @param input - required input to pass to integrationJiraSettingsUpdate
   * @returns IntegrationPayload
   */
  public integrationJiraSettingsUpdate(input: L.JiraSettingsInput): LinearFetch<IntegrationPayload> {
    return new IntegrationJiraSettingsUpdateMutation(this._request).fetch(input);
  }
  /**
   * Enables Loom integration for the organization.
   *
   * @returns IntegrationPayload
   */
  public get integrationLoom(): LinearFetch<IntegrationPayload> {
    return new IntegrationLoomMutation(this._request).fetch();
  }
  /**
   * Archives an integration resource.
   *
   * @param id - required id to pass to integrationResourceArchive
   * @returns ArchivePayload
   */
  public integrationResourceArchive(id: string): LinearFetch<ArchivePayload> {
    return new IntegrationResourceArchiveMutation(this._request).fetch(id);
  }
  /**
   * Integrates the organization with Sentry.
   *
   * @param code - required code to pass to integrationSentryConnect
   * @param installationId - required installationId to pass to integrationSentryConnect
   * @param organizationSlug - required organizationSlug to pass to integrationSentryConnect
   * @returns IntegrationPayload
   */
  public integrationSentryConnect(
    code: string,
    installationId: string,
    organizationSlug: string
  ): LinearFetch<IntegrationPayload> {
    return new IntegrationSentryConnectMutation(this._request).fetch(code, installationId, organizationSlug);
  }
  /**
   * Integrates the organization with Slack.
   *
   * @param code - required code to pass to integrationSlack
   * @param redirectUri - required redirectUri to pass to integrationSlack
   * @param variables - variables without 'code', 'redirectUri' to pass into the IntegrationSlackMutation
   * @returns IntegrationPayload
   */
  public integrationSlack(
    code: string,
    redirectUri: string,
    variables?: Omit<L.IntegrationSlackMutationVariables, "code" | "redirectUri">
  ): LinearFetch<IntegrationPayload> {
    return new IntegrationSlackMutation(this._request).fetch(code, redirectUri, variables);
  }
  /**
   * Imports custom emojis from your Slack workspace.
   *
   * @param code - required code to pass to integrationSlackImportEmojis
   * @param redirectUri - required redirectUri to pass to integrationSlackImportEmojis
   * @returns IntegrationPayload
   */
  public integrationSlackImportEmojis(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    return new IntegrationSlackImportEmojisMutation(this._request).fetch(code, redirectUri);
  }
  /**
   * Integrates your personal notifications with Slack.
   *
   * @param code - required code to pass to integrationSlackPersonal
   * @param redirectUri - required redirectUri to pass to integrationSlackPersonal
   * @returns IntegrationPayload
   */
  public integrationSlackPersonal(code: string, redirectUri: string): LinearFetch<IntegrationPayload> {
    return new IntegrationSlackPersonalMutation(this._request).fetch(code, redirectUri);
  }
  /**
   * Slack webhook integration.
   *
   * @param code - required code to pass to integrationSlackPost
   * @param redirectUri - required redirectUri to pass to integrationSlackPost
   * @param teamId - required teamId to pass to integrationSlackPost
   * @param variables - variables without 'code', 'redirectUri', 'teamId' to pass into the IntegrationSlackPostMutation
   * @returns IntegrationPayload
   */
  public integrationSlackPost(
    code: string,
    redirectUri: string,
    teamId: string,
    variables?: Omit<L.IntegrationSlackPostMutationVariables, "code" | "redirectUri" | "teamId">
  ): LinearFetch<IntegrationPayload> {
    return new IntegrationSlackPostMutation(this._request).fetch(code, redirectUri, teamId, variables);
  }
  /**
   * Slack integration for project notifications.
   *
   * @param code - required code to pass to integrationSlackProjectPost
   * @param projectId - required projectId to pass to integrationSlackProjectPost
   * @param redirectUri - required redirectUri to pass to integrationSlackProjectPost
   * @returns IntegrationPayload
   */
  public integrationSlackProjectPost(
    code: string,
    projectId: string,
    redirectUri: string
  ): LinearFetch<IntegrationPayload> {
    return new IntegrationSlackProjectPostMutation(this._request).fetch(code, projectId, redirectUri);
  }
  /**
   * Integrates the organization with Zendesk.
   *
   * @param code - required code to pass to integrationZendesk
   * @param redirectUri - required redirectUri to pass to integrationZendesk
   * @param scope - required scope to pass to integrationZendesk
   * @param subdomain - required subdomain to pass to integrationZendesk
   * @returns IntegrationPayload
   */
  public integrationZendesk(
    code: string,
    redirectUri: string,
    scope: string,
    subdomain: string
  ): LinearFetch<IntegrationPayload> {
    return new IntegrationZendeskMutation(this._request).fetch(code, redirectUri, scope, subdomain);
  }
  /**
   * Archives an issue.
   *
   * @param id - required id to pass to issueArchive
   * @param variables - variables without 'id' to pass into the IssueArchiveMutation
   * @returns ArchivePayload
   */
  public issueArchive(
    id: string,
    variables?: Omit<L.IssueArchiveMutationVariables, "id">
  ): LinearFetch<ArchivePayload> {
    return new IssueArchiveMutation(this._request).fetch(id, variables);
  }
  /**
   * Updates multiple issues at once.
   *
   * @param ids - required ids to pass to issueBatchUpdate
   * @param input - required input to pass to issueBatchUpdate
   * @returns IssueBatchPayload
   */
  public issueBatchUpdate(ids: L.Scalars["UUID"][], input: L.IssueUpdateInput): LinearFetch<IssueBatchPayload> {
    return new IssueBatchUpdateMutation(this._request).fetch(ids, input);
  }
  /**
   * Creates a new issue.
   *
   * @param input - required input to pass to issueCreate
   * @returns IssuePayload
   */
  public issueCreate(input: L.IssueCreateInput): LinearFetch<IssuePayload> {
    return new IssueCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes (trashes) an issue.
   *
   * @param id - required id to pass to issueDelete
   * @returns ArchivePayload
   */
  public issueDelete(id: string): LinearFetch<ArchivePayload> {
    return new IssueDeleteMutation(this._request).fetch(id);
  }
  /**
   * Kicks off an Asana import job.
   *
   * @param asanaTeamName - required asanaTeamName to pass to issueImportCreateAsana
   * @param asanaToken - required asanaToken to pass to issueImportCreateAsana
   * @param teamId - required teamId to pass to issueImportCreateAsana
   * @param variables - variables without 'asanaTeamName', 'asanaToken', 'teamId' to pass into the IssueImportCreateAsanaMutation
   * @returns IssueImportPayload
   */
  public issueImportCreateAsana(
    asanaTeamName: string,
    asanaToken: string,
    teamId: string,
    variables?: Omit<L.IssueImportCreateAsanaMutationVariables, "asanaTeamName" | "asanaToken" | "teamId">
  ): LinearFetch<IssueImportPayload> {
    return new IssueImportCreateAsanaMutation(this._request).fetch(asanaTeamName, asanaToken, teamId, variables);
  }
  /**
   * Kicks off a Clubhouse import job.
   *
   * @param clubhouseTeamName - required clubhouseTeamName to pass to issueImportCreateClubhouse
   * @param clubhouseToken - required clubhouseToken to pass to issueImportCreateClubhouse
   * @param teamId - required teamId to pass to issueImportCreateClubhouse
   * @param variables - variables without 'clubhouseTeamName', 'clubhouseToken', 'teamId' to pass into the IssueImportCreateClubhouseMutation
   * @returns IssueImportPayload
   */
  public issueImportCreateClubhouse(
    clubhouseTeamName: string,
    clubhouseToken: string,
    teamId: string,
    variables?: Omit<L.IssueImportCreateClubhouseMutationVariables, "clubhouseTeamName" | "clubhouseToken" | "teamId">
  ): LinearFetch<IssueImportPayload> {
    return new IssueImportCreateClubhouseMutation(this._request).fetch(
      clubhouseTeamName,
      clubhouseToken,
      teamId,
      variables
    );
  }
  /**
   * Kicks off a GitHub import job.
   *
   * @param githubRepoName - required githubRepoName to pass to issueImportCreateGithub
   * @param githubRepoOwner - required githubRepoOwner to pass to issueImportCreateGithub
   * @param githubToken - required githubToken to pass to issueImportCreateGithub
   * @param teamId - required teamId to pass to issueImportCreateGithub
   * @param variables - variables without 'githubRepoName', 'githubRepoOwner', 'githubToken', 'teamId' to pass into the IssueImportCreateGithubMutation
   * @returns IssueImportPayload
   */
  public issueImportCreateGithub(
    githubRepoName: string,
    githubRepoOwner: string,
    githubToken: string,
    teamId: string,
    variables?: Omit<
      L.IssueImportCreateGithubMutationVariables,
      "githubRepoName" | "githubRepoOwner" | "githubToken" | "teamId"
    >
  ): LinearFetch<IssueImportPayload> {
    return new IssueImportCreateGithubMutation(this._request).fetch(
      githubRepoName,
      githubRepoOwner,
      githubToken,
      teamId,
      variables
    );
  }
  /**
   * Kicks off a Jira import job.
   *
   * @param jiraEmail - required jiraEmail to pass to issueImportCreateJira
   * @param jiraHostname - required jiraHostname to pass to issueImportCreateJira
   * @param jiraProject - required jiraProject to pass to issueImportCreateJira
   * @param jiraToken - required jiraToken to pass to issueImportCreateJira
   * @param teamId - required teamId to pass to issueImportCreateJira
   * @param variables - variables without 'jiraEmail', 'jiraHostname', 'jiraProject', 'jiraToken', 'teamId' to pass into the IssueImportCreateJiraMutation
   * @returns IssueImportPayload
   */
  public issueImportCreateJira(
    jiraEmail: string,
    jiraHostname: string,
    jiraProject: string,
    jiraToken: string,
    teamId: string,
    variables?: Omit<
      L.IssueImportCreateJiraMutationVariables,
      "jiraEmail" | "jiraHostname" | "jiraProject" | "jiraToken" | "teamId"
    >
  ): LinearFetch<IssueImportPayload> {
    return new IssueImportCreateJiraMutation(this._request).fetch(
      jiraEmail,
      jiraHostname,
      jiraProject,
      jiraToken,
      teamId,
      variables
    );
  }
  /**
   * Deletes an import job.
   *
   * @param issueImportId - required issueImportId to pass to issueImportDelete
   * @returns IssueImportDeletePayload
   */
  public issueImportDelete(issueImportId: string): LinearFetch<IssueImportDeletePayload> {
    return new IssueImportDeleteMutation(this._request).fetch(issueImportId);
  }
  /**
   * Kicks off import processing.
   *
   * @param issueImportId - required issueImportId to pass to issueImportProcess
   * @param mapping - required mapping to pass to issueImportProcess
   * @returns IssueImportPayload
   */
  public issueImportProcess(issueImportId: string, mapping: Record<string, unknown>): LinearFetch<IssueImportPayload> {
    return new IssueImportProcessMutation(this._request).fetch(issueImportId, mapping);
  }
  /**
   * Updates the mapping for the issue import.
   *
   * @param id - required id to pass to issueImportUpdate
   * @param input - required input to pass to issueImportUpdate
   * @returns IssueImportPayload
   */
  public issueImportUpdate(id: string, input: L.IssueImportUpdateInput): LinearFetch<IssueImportPayload> {
    return new IssueImportUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Archives an issue label.
   *
   * @param id - required id to pass to issueLabelArchive
   * @returns ArchivePayload
   */
  public issueLabelArchive(id: string): LinearFetch<ArchivePayload> {
    return new IssueLabelArchiveMutation(this._request).fetch(id);
  }
  /**
   * Creates a new label.
   *
   * @param input - required input to pass to issueLabelCreate
   * @returns IssueLabelPayload
   */
  public issueLabelCreate(input: L.IssueLabelCreateInput): LinearFetch<IssueLabelPayload> {
    return new IssueLabelCreateMutation(this._request).fetch(input);
  }
  /**
   * Updates an label.
   *
   * @param id - required id to pass to issueLabelUpdate
   * @param input - required input to pass to issueLabelUpdate
   * @returns IssueLabelPayload
   */
  public issueLabelUpdate(id: string, input: L.IssueLabelUpdateInput): LinearFetch<IssueLabelPayload> {
    return new IssueLabelUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Creates a new issue relation.
   *
   * @param input - required input to pass to issueRelationCreate
   * @returns IssueRelationPayload
   */
  public issueRelationCreate(input: L.IssueRelationCreateInput): LinearFetch<IssueRelationPayload> {
    return new IssueRelationCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes an issue relation.
   *
   * @param id - required id to pass to issueRelationDelete
   * @returns ArchivePayload
   */
  public issueRelationDelete(id: string): LinearFetch<ArchivePayload> {
    return new IssueRelationDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates an issue relation.
   *
   * @param id - required id to pass to issueRelationUpdate
   * @param input - required input to pass to issueRelationUpdate
   * @returns IssueRelationPayload
   */
  public issueRelationUpdate(id: string, input: L.IssueRelationUpdateInput): LinearFetch<IssueRelationPayload> {
    return new IssueRelationUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Unarchives an issue.
   *
   * @param id - required id to pass to issueUnarchive
   * @returns ArchivePayload
   */
  public issueUnarchive(id: string): LinearFetch<ArchivePayload> {
    return new IssueUnarchiveMutation(this._request).fetch(id);
  }
  /**
   * Updates an issue.
   *
   * @param id - required id to pass to issueUpdate
   * @param input - required input to pass to issueUpdate
   * @returns IssuePayload
   */
  public issueUpdate(id: string, input: L.IssueUpdateInput): LinearFetch<IssuePayload> {
    return new IssueUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * [INTERNAL] Connects the organization with a Jira Personal Access Token.
   *
   * @param input - required input to pass to jiraIntegrationConnect
   * @returns IntegrationPayload
   */
  public jiraIntegrationConnect(input: L.JiraConfigurationInput): LinearFetch<IntegrationPayload> {
    return new JiraIntegrationConnectMutation(this._request).fetch(input);
  }
  /**
   * Join an organization from onboarding.
   *
   * @param input - required input to pass to joinOrganizationFromOnboarding
   * @returns CreateOrJoinOrganizationResponse
   */
  public joinOrganizationFromOnboarding(input: L.JoinOrganizationInput): LinearFetch<CreateOrJoinOrganizationResponse> {
    return new JoinOrganizationFromOnboardingMutation(this._request).fetch(input);
  }
  /**
   * Leave an organization.
   *
   * @param organizationId - required organizationId to pass to leaveOrganization
   * @returns CreateOrJoinOrganizationResponse
   */
  public leaveOrganization(organizationId: string): LinearFetch<CreateOrJoinOrganizationResponse> {
    return new LeaveOrganizationMutation(this._request).fetch(organizationId);
  }
  /**
   * Creates a new milestone.
   *
   * @param input - required input to pass to milestoneCreate
   * @returns MilestonePayload
   */
  public milestoneCreate(input: L.MilestoneCreateInput): LinearFetch<MilestonePayload> {
    return new MilestoneCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a milestone.
   *
   * @param id - required id to pass to milestoneDelete
   * @returns ArchivePayload
   */
  public milestoneDelete(id: string): LinearFetch<ArchivePayload> {
    return new MilestoneDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates a milestone.
   *
   * @param id - required id to pass to milestoneUpdate
   * @param input - required input to pass to milestoneUpdate
   * @returns MilestonePayload
   */
  public milestoneUpdate(id: string, input: L.MilestoneUpdateInput): LinearFetch<MilestonePayload> {
    return new MilestoneUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Archives a notification.
   *
   * @param id - required id to pass to notificationArchive
   * @returns ArchivePayload
   */
  public notificationArchive(id: string): LinearFetch<ArchivePayload> {
    return new NotificationArchiveMutation(this._request).fetch(id);
  }
  /**
   * Creates a notification.
   *
   * @param id - required id to pass to notificationCreate
   * @param input - required input to pass to notificationCreate
   * @returns NotificationPayload
   */
  public notificationCreate(id: string, input: L.NotificationUpdateInput): LinearFetch<NotificationPayload> {
    return new NotificationCreateMutation(this._request).fetch(id, input);
  }
  /**
   * Creates a new notification subscription for a team or a project.
   *
   * @param input - required input to pass to notificationSubscriptionCreate
   * @returns NotificationSubscriptionPayload
   */
  public notificationSubscriptionCreate(
    input: L.NotificationSubscriptionCreateInput
  ): LinearFetch<NotificationSubscriptionPayload> {
    return new NotificationSubscriptionCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a notification subscription reference.
   *
   * @param id - required id to pass to notificationSubscriptionDelete
   * @returns ArchivePayload
   */
  public notificationSubscriptionDelete(id: string): LinearFetch<ArchivePayload> {
    return new NotificationSubscriptionDeleteMutation(this._request).fetch(id);
  }
  /**
   * Unarchives a notification.
   *
   * @param id - required id to pass to notificationUnarchive
   * @returns ArchivePayload
   */
  public notificationUnarchive(id: string): LinearFetch<ArchivePayload> {
    return new NotificationUnarchiveMutation(this._request).fetch(id);
  }
  /**
   * Updates a notification.
   *
   * @param id - required id to pass to notificationUpdate
   * @param input - required input to pass to notificationUpdate
   * @returns NotificationPayload
   */
  public notificationUpdate(id: string, input: L.NotificationUpdateInput): LinearFetch<NotificationPayload> {
    return new NotificationUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Archives an OAuth client.
   *
   * @param id - required id to pass to oauthClientArchive
   * @returns ArchivePayload
   */
  public oauthClientArchive(id: string): LinearFetch<ArchivePayload> {
    return new OauthClientArchiveMutation(this._request).fetch(id);
  }
  /**
   * Creates a new OAuth client.
   *
   * @param input - required input to pass to oauthClientCreate
   * @returns OauthClientPayload
   */
  public oauthClientCreate(input: L.OauthClientCreateInput): LinearFetch<OauthClientPayload> {
    return new OauthClientCreateMutation(this._request).fetch(input);
  }
  /**
   * Updates an OAuth client.
   *
   * @param id - required id to pass to oauthClientRotateSecret
   * @returns RotateSecretPayload
   */
  public oauthClientRotateSecret(id: string): LinearFetch<RotateSecretPayload> {
    return new OauthClientRotateSecretMutation(this._request).fetch(id);
  }
  /**
   * Updates an OAuth client.
   *
   * @param id - required id to pass to oauthClientUpdate
   * @param input - required input to pass to oauthClientUpdate
   * @returns OauthClientPayload
   */
  public oauthClientUpdate(id: string, input: L.OauthClientUpdateInput): LinearFetch<OauthClientPayload> {
    return new OauthClientUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Revokes an OAuth token.
   *
   * @param appId - required appId to pass to oauthTokenRevoke
   * @param scope - required scope to pass to oauthTokenRevoke
   * @returns OauthTokenRevokePayload
   */
  public oauthTokenRevoke(appId: string, scope: string[]): LinearFetch<OauthTokenRevokePayload> {
    return new OauthTokenRevokeMutation(this._request).fetch(appId, scope);
  }
  /**
   * Cancels the deletion of an organization. Administrator privileges required.
   *
   * @returns OrganizationCancelDeletePayload
   */
  public get organizationCancelDelete(): LinearFetch<OrganizationCancelDeletePayload> {
    return new OrganizationCancelDeleteMutation(this._request).fetch();
  }
  /**
   * Delete's an organization. Administrator privileges required.
   *
   * @param input - required input to pass to organizationDelete
   * @returns OrganizationDeletePayload
   */
  public organizationDelete(input: L.DeleteOrganizationInput): LinearFetch<OrganizationDeletePayload> {
    return new OrganizationDeleteMutation(this._request).fetch(input);
  }
  /**
   * Get an organization's delete confirmation token. Administrator privileges required.
   *
   * @returns OrganizationDeletePayload
   */
  public get organizationDeleteChallenge(): LinearFetch<OrganizationDeletePayload> {
    return new OrganizationDeleteChallengeMutation(this._request).fetch();
  }
  /**
   * Adds a domain to be allowed for an organization.
   *
   * @param input - required input to pass to organizationDomainCreate
   * @returns OrganizationDomainPayload
   */
  public organizationDomainCreate(input: L.OrganizationDomainCreateInput): LinearFetch<OrganizationDomainPayload> {
    return new OrganizationDomainCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a domain.
   *
   * @param id - required id to pass to organizationDomainDelete
   * @returns ArchivePayload
   */
  public organizationDomainDelete(id: string): LinearFetch<ArchivePayload> {
    return new OrganizationDomainDeleteMutation(this._request).fetch(id);
  }
  /**
   * Verifies a domain to be added to an organization.
   *
   * @param input - required input to pass to organizationDomainVerify
   * @returns OrganizationDomainPayload
   */
  public organizationDomainVerify(
    input: L.OrganizationDomainVerificationInput
  ): LinearFetch<OrganizationDomainPayload> {
    return new OrganizationDomainVerifyMutation(this._request).fetch(input);
  }
  /**
   * Creates a new organization invite.
   *
   * @param input - required input to pass to organizationInviteCreate
   * @returns OrganizationInvitePayload
   */
  public organizationInviteCreate(input: L.OrganizationInviteCreateInput): LinearFetch<OrganizationInvitePayload> {
    return new OrganizationInviteCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes an organization invite.
   *
   * @param id - required id to pass to organizationInviteDelete
   * @returns ArchivePayload
   */
  public organizationInviteDelete(id: string): LinearFetch<ArchivePayload> {
    return new OrganizationInviteDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates the user's organization.
   *
   * @param input - required input to pass to organizationUpdate
   * @returns OrganizationPayload
   */
  public organizationUpdate(input: L.UpdateOrganizationInput): LinearFetch<OrganizationPayload> {
    return new OrganizationUpdateMutation(this._request).fetch(input);
  }
  /**
   * Archives a project.
   *
   * @param id - required id to pass to projectArchive
   * @returns ArchivePayload
   */
  public projectArchive(id: string): LinearFetch<ArchivePayload> {
    return new ProjectArchiveMutation(this._request).fetch(id);
  }
  /**
   * Creates a new project.
   *
   * @param input - required input to pass to projectCreate
   * @returns ProjectPayload
   */
  public projectCreate(input: L.ProjectCreateInput): LinearFetch<ProjectPayload> {
    return new ProjectCreateMutation(this._request).fetch(input);
  }
  /**
   * Creates a new project link.
   *
   * @param input - required input to pass to projectLinkCreate
   * @returns ProjectLinkPayload
   */
  public projectLinkCreate(input: L.ProjectLinkCreateInput): LinearFetch<ProjectLinkPayload> {
    return new ProjectLinkCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a project link.
   *
   * @param id - required id to pass to projectLinkDelete
   * @returns ArchivePayload
   */
  public projectLinkDelete(id: string): LinearFetch<ArchivePayload> {
    return new ProjectLinkDeleteMutation(this._request).fetch(id);
  }
  /**
   * Unarchives a project.
   *
   * @param id - required id to pass to projectUnarchive
   * @returns ArchivePayload
   */
  public projectUnarchive(id: string): LinearFetch<ArchivePayload> {
    return new ProjectUnarchiveMutation(this._request).fetch(id);
  }
  /**
   * Updates a project.
   *
   * @param id - required id to pass to projectUpdate
   * @param input - required input to pass to projectUpdate
   * @returns ProjectPayload
   */
  public projectUpdate(id: string, input: L.ProjectUpdateInput): LinearFetch<ProjectPayload> {
    return new ProjectUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Creates a push subscription.
   *
   * @param input - required input to pass to pushSubscriptionCreate
   * @returns PushSubscriptionPayload
   */
  public pushSubscriptionCreate(input: L.PushSubscriptionCreateInput): LinearFetch<PushSubscriptionPayload> {
    return new PushSubscriptionCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a push subscription.
   *
   * @param id - required id to pass to pushSubscriptionDelete
   * @returns PushSubscriptionPayload
   */
  public pushSubscriptionDelete(id: string): LinearFetch<PushSubscriptionPayload> {
    return new PushSubscriptionDeleteMutation(this._request).fetch(id);
  }
  /**
   * Creates a new reaction.
   *
   * @param input - required input to pass to reactionCreate
   * @returns ReactionPayload
   */
  public reactionCreate(input: L.ReactionCreateInput): LinearFetch<ReactionPayload> {
    return new ReactionCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a reaction.
   *
   * @param id - required id to pass to reactionDelete
   * @returns ArchivePayload
   */
  public reactionDelete(id: string): LinearFetch<ArchivePayload> {
    return new ReactionDeleteMutation(this._request).fetch(id);
  }
  /**
   * Manually update Google Sheets data.
   *
   * @param id - required id to pass to refreshGoogleSheetsData
   * @returns IntegrationPayload
   */
  public refreshGoogleSheetsData(id: string): LinearFetch<IntegrationPayload> {
    return new RefreshGoogleSheetsDataMutation(this._request).fetch(id);
  }
  /**
   * Re-send an organization invite.
   *
   * @param id - required id to pass to resendOrganizationInvite
   * @returns ArchivePayload
   */
  public resendOrganizationInvite(id: string): LinearFetch<ArchivePayload> {
    return new ResendOrganizationInviteMutation(this._request).fetch(id);
  }
  /**
   * Authenticates a user account via email and authentication token for SAML.
   *
   * @param input - required input to pass to samlTokenUserAccountAuth
   * @returns AuthResolverResponse
   */
  public samlTokenUserAccountAuth(input: L.TokenUserAccountAuthInput): LinearFetch<AuthResolverResponse> {
    return new SamlTokenUserAccountAuthMutation(this._request).fetch(input);
  }
  /**
   * Creates a new team. The user who creates the team will automatically be added as a member to the newly created team.
   *
   * @param input - required input to pass to teamCreate
   * @param variables - variables without 'input' to pass into the TeamCreateMutation
   * @returns TeamPayload
   */
  public teamCreate(
    input: L.TeamCreateInput,
    variables?: Omit<L.TeamCreateMutationVariables, "input">
  ): LinearFetch<TeamPayload> {
    return new TeamCreateMutation(this._request).fetch(input, variables);
  }
  /**
   * Deletes a team.
   *
   * @param id - required id to pass to teamDelete
   * @returns ArchivePayload
   */
  public teamDelete(id: string): LinearFetch<ArchivePayload> {
    return new TeamDeleteMutation(this._request).fetch(id);
  }
  /**
   * Deletes a previously used team key.
   *
   * @param id - required id to pass to teamKeyDelete
   * @returns ArchivePayload
   */
  public teamKeyDelete(id: string): LinearFetch<ArchivePayload> {
    return new TeamKeyDeleteMutation(this._request).fetch(id);
  }
  /**
   * Creates a new team membership.
   *
   * @param input - required input to pass to teamMembershipCreate
   * @returns TeamMembershipPayload
   */
  public teamMembershipCreate(input: L.TeamMembershipCreateInput): LinearFetch<TeamMembershipPayload> {
    return new TeamMembershipCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a team membership.
   *
   * @param id - required id to pass to teamMembershipDelete
   * @returns ArchivePayload
   */
  public teamMembershipDelete(id: string): LinearFetch<ArchivePayload> {
    return new TeamMembershipDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates a team membership.
   *
   * @param id - required id to pass to teamMembershipUpdate
   * @param input - required input to pass to teamMembershipUpdate
   * @returns TeamMembershipPayload
   */
  public teamMembershipUpdate(id: string, input: L.TeamMembershipUpdateInput): LinearFetch<TeamMembershipPayload> {
    return new TeamMembershipUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Updates a team.
   *
   * @param id - required id to pass to teamUpdate
   * @param input - required input to pass to teamUpdate
   * @returns TeamPayload
   */
  public teamUpdate(id: string, input: L.TeamUpdateInput): LinearFetch<TeamPayload> {
    return new TeamUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Creates a new template.
   *
   * @param input - required input to pass to templateCreate
   * @returns TemplatePayload
   */
  public templateCreate(input: L.TemplateCreateInput): LinearFetch<TemplatePayload> {
    return new TemplateCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a template.
   *
   * @param id - required id to pass to templateDelete
   * @returns ArchivePayload
   */
  public templateDelete(id: string): LinearFetch<ArchivePayload> {
    return new TemplateDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates an existing template.
   *
   * @param id - required id to pass to templateUpdate
   * @param input - required input to pass to templateUpdate
   * @returns TemplatePayload
   */
  public templateUpdate(id: string, input: L.TemplateUpdateInput): LinearFetch<TemplatePayload> {
    return new TemplateUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Makes user a regular user. Can only be called by an admin.
   *
   * @param id - required id to pass to userDemoteAdmin
   * @returns UserAdminPayload
   */
  public userDemoteAdmin(id: string): LinearFetch<UserAdminPayload> {
    return new UserDemoteAdminMutation(this._request).fetch(id);
  }
  /**
   * Updates a user's settings flag.
   *
   * @param flag - required flag to pass to userFlagUpdate
   * @param operation - required operation to pass to userFlagUpdate
   * @returns UserSettingsFlagPayload
   */
  public userFlagUpdate(
    flag: L.UserFlagType,
    operation: L.UserFlagUpdateOperation
  ): LinearFetch<UserSettingsFlagPayload> {
    return new UserFlagUpdateMutation(this._request).fetch(flag, operation);
  }
  /**
   * Makes user an admin. Can only be called by an admin.
   *
   * @param id - required id to pass to userPromoteAdmin
   * @returns UserAdminPayload
   */
  public userPromoteAdmin(id: string): LinearFetch<UserAdminPayload> {
    return new UserPromoteAdminMutation(this._request).fetch(id);
  }
  /**
   * [Deprecated] Updates a user's settings flag.
   *
   * @param flag - required flag to pass to userSettingsFlagIncrement
   * @returns UserSettingsFlagPayload
   */
  public userSettingsFlagIncrement(flag: string): LinearFetch<UserSettingsFlagPayload> {
    return new UserSettingsFlagIncrementMutation(this._request).fetch(flag);
  }
  /**
   * Resets user's setting flags.
   *
   * @returns UserSettingsFlagsResetPayload
   */
  public get userSettingsFlagsReset(): LinearFetch<UserSettingsFlagsResetPayload> {
    return new UserSettingsFlagsResetMutation(this._request).fetch();
  }
  /**
   * Updates the user's settings.
   *
   * @param id - required id to pass to userSettingsUpdate
   * @param input - required input to pass to userSettingsUpdate
   * @returns UserSettingsPayload
   */
  public userSettingsUpdate(id: string, input: L.UserSettingsUpdateInput): LinearFetch<UserSettingsPayload> {
    return new UserSettingsUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Subscribes user to changelog newsletter.
   *
   * @returns UserSubscribeToNewsletterPayload
   */
  public get userSubscribeToNewsletter(): LinearFetch<UserSubscribeToNewsletterPayload> {
    return new UserSubscribeToNewsletterMutation(this._request).fetch();
  }
  /**
   * Suspends a user. Can only be called by an admin.
   *
   * @param id - required id to pass to userSuspend
   * @returns UserAdminPayload
   */
  public userSuspend(id: string): LinearFetch<UserAdminPayload> {
    return new UserSuspendMutation(this._request).fetch(id);
  }
  /**
   * Un-suspends a user. Can only be called by an admin.
   *
   * @param id - required id to pass to userUnsuspend
   * @returns UserAdminPayload
   */
  public userUnsuspend(id: string): LinearFetch<UserAdminPayload> {
    return new UserUnsuspendMutation(this._request).fetch(id);
  }
  /**
   * Updates a user. Only available to organization admins and the user themselves.
   *
   * @param id - required id to pass to userUpdate
   * @param input - required input to pass to userUpdate
   * @returns UserPayload
   */
  public userUpdate(id: string, input: L.UpdateUserInput): LinearFetch<UserPayload> {
    return new UserUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Creates a new ViewPreferences object.
   *
   * @param input - required input to pass to viewPreferencesCreate
   * @returns ViewPreferencesPayload
   */
  public viewPreferencesCreate(input: L.ViewPreferencesCreateInput): LinearFetch<ViewPreferencesPayload> {
    return new ViewPreferencesCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a ViewPreferences.
   *
   * @param id - required id to pass to viewPreferencesDelete
   * @returns ArchivePayload
   */
  public viewPreferencesDelete(id: string): LinearFetch<ArchivePayload> {
    return new ViewPreferencesDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates an existing ViewPreferences object.
   *
   * @param id - required id to pass to viewPreferencesUpdate
   * @param input - required input to pass to viewPreferencesUpdate
   * @returns ViewPreferencesPayload
   */
  public viewPreferencesUpdate(id: string, input: L.ViewPreferencesUpdateInput): LinearFetch<ViewPreferencesPayload> {
    return new ViewPreferencesUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Creates a new webhook.
   *
   * @param input - required input to pass to webhookCreate
   * @returns WebhookPayload
   */
  public webhookCreate(input: L.WebhookCreateInput): LinearFetch<WebhookPayload> {
    return new WebhookCreateMutation(this._request).fetch(input);
  }
  /**
   * Deletes a Webhook.
   *
   * @param id - required id to pass to webhookDelete
   * @returns ArchivePayload
   */
  public webhookDelete(id: string): LinearFetch<ArchivePayload> {
    return new WebhookDeleteMutation(this._request).fetch(id);
  }
  /**
   * Updates an existing Webhook.
   *
   * @param id - required id to pass to webhookUpdate
   * @param input - required input to pass to webhookUpdate
   * @returns WebhookPayload
   */
  public webhookUpdate(id: string, input: L.WebhookUpdateInput): LinearFetch<WebhookPayload> {
    return new WebhookUpdateMutation(this._request).fetch(id, input);
  }
  /**
   * Archives a state. Only states with issues that have all been archived can be archived.
   *
   * @param id - required id to pass to workflowStateArchive
   * @returns ArchivePayload
   */
  public workflowStateArchive(id: string): LinearFetch<ArchivePayload> {
    return new WorkflowStateArchiveMutation(this._request).fetch(id);
  }
  /**
   * Creates a new state, adding it to the workflow of a team.
   *
   * @param input - required input to pass to workflowStateCreate
   * @returns WorkflowStatePayload
   */
  public workflowStateCreate(input: L.WorkflowStateCreateInput): LinearFetch<WorkflowStatePayload> {
    return new WorkflowStateCreateMutation(this._request).fetch(input);
  }
  /**
   * Updates a state.
   *
   * @param id - required id to pass to workflowStateUpdate
   * @param input - required input to pass to workflowStateUpdate
   * @returns WorkflowStatePayload
   */
  public workflowStateUpdate(id: string, input: L.WorkflowStateUpdateInput): LinearFetch<WorkflowStatePayload> {
    return new WorkflowStateUpdateMutation(this._request).fetch(id, input);
  }
}
