<div class="col-12 layout-wrapper d-flex flex-wrap justify-content-between">

    <div class="c-box full d-flex flex-wrap">
        <div class="col-12 c-box-heading">
            <p>Invite someone outside of C-Link</p>
        </div>
        <div class="col-12 c-box-content">
            <form class="d-flex flex-wrap" method="post">
                <div class="col-12 col-lg-4 field-holder">
                    <label><i class="far fa-user"></i>Name</label>
                    <input type="text" placeholder="Full Name" required>
                </div>
                <div class="col-12 col-lg-4 field-holder">
                    <label><i class="far fa-envelope-open"></i> Email</label>
                    <input type="email" placeholder="@" required>
                </div>
                <div class="col-12 col-lg-4 field-holder">
                    <label><i class="fas fa-phone-alt"></i> User Type</label>
                    <div class="select-block added">
                        <div class="custom-select">
                            <div class="active-list">Assistant</div>
                            <input type="text" name="member-role" class="list-field" value="3"/>
                            <ul class="drop-down-list">
                                <li data-id="1"><span style="min-width:60px;display:inline-block">Admin</span> <span data-toggle="popover" data-trigger="hover" title="" data-content="Admins are usually a company director " data-original-title="Quick Tip"><i class="fa fa-info-circle"></i> </span> </li>
                                <li data-id="2"><span style="min-width:60px;display:inline-block">Manager</span> <span data-toggle="popover" data-trigger="hover" title="" data-content="Managers are project leaders or commercial/contracts managers " data-original-title="Quick Tip"><i class="fa fa-info-circle"></i> </span> </li>
                                <li data-id="3"><span style="min-width:60px;display:inline-block">Assistant</span> <span data-toggle="popover" data-trigger="hover" title="" data-content="Assistants are assistant QS' or PMs " data-original-title="Quick Tip"><i class="fa fa-info-circle"></i> </span> </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-12 text-center">
                    <button class="submit danger-btn"><i class="fas fa-user-plus"></i> Invite to Team</button>
                </div>
            </form>
        </div>

    </div>

    <div class="tabs-wrapper">

        <nav>
            <div class="nav nav-tabs tab-nav" id="nav-tab" role="tablist">
                <a class="nav-link active" id="nav-home-tab" data-toggle="tab" href="#nav-build" role="tab" aria-controls="nav-home" aria-selected="true"><i class="fas fa-user-plus"></i> Build your Team</a>
                <a class="nav-link" id="nav-profile-tab" data-toggle="tab" href="#nav-projects" role="tab" aria-controls="nav-profile" aria-selected="false"><i class="fas fa-users-cog"></i> Project Team</a>
            </div>
        </nav>
        <div class="tab-content tab-content-wrapper" id="nav-tabContent">
            <div class="tab-pane fade show active" id="nav-build" role="tabpanel" aria-labelledby="nav-home-tab">

                <div class="flip-scroll">

                    <table class="cf">
                        <thead>
                        <tr>
                            <th>
                                <label class="label--checkbox">
                                    <input type="checkbox" class="checkbox" data-container="body" data-toggle="popover" data-trigger="hover" data-placement="top">
                                </label>
                            </th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <label class="label--checkbox" >
                                        <input type="checkbox" class="checkbox">
                                    </label>
                                </td>
                                <td>
                                    <p>Daniel Barbatosu</p>
                                    <span class="admin">Admin</span>
                                </td>
                                <td>dan@mail.com</td>
                                <td>

                                    <div class="btn-group">
                                        <a href="#" class="dropdown-toggle trigger" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-ellipsis-h"></i></a>
                                        <div class="dropdown-menu dropdown-menu-right user-actions">
                                            <a href="#" class="edit"><i class="far fa-edit"></i> Assign Projects</a>
                                            <a href="#" class="delete" data-toggle="modal" data-target="#delete-dialog"><i class="fas fa-eraser" ></i> Delete</a>
                                        </div>
                                    </div>

                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label class="label--checkbox" >
                                        <input type="checkbox" class="checkbox">
                                    </label>
                                </td>
                                <td>
                                    <p>Rober Dean</p>
                                    <span class="manager">Manager</span>
                                </td>
                                <td>rob@mail.com</td>
                                <td>

                                    <div class="btn-group">
                                        <a href="#" class="dropdown-toggle trigger" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-ellipsis-h"></i></a>
                                        <div class="dropdown-menu dropdown-menu-right user-actions">
                                            <a href="#" class="edit"><i class="far fa-edit"></i> Assign Projects</a>
                                            <a href="#" class="delete" data-toggle="modal" data-target="#delete-dialog"><i class="fas fa-eraser" ></i> Delete</a>
                                        </div>
                                    </div>

                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label class="label--checkbox" >
                                        <input type="checkbox" class="checkbox">
                                    </label>
                                </td>
                                <td>
                                    <p>Florin Berdila</p>
                                    <span class="assistant">Assistant</span>
                                </td>
                                <td>florin@mail.com</td>
                                <td>

                                    <div class="btn-group">
                                        <a href="#" class="dropdown-toggle trigger" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-ellipsis-h"></i></a>
                                        <div class="dropdown-menu dropdown-menu-right user-actions">
                                            <a href="#" class="edit"><i class="far fa-edit"></i> Assign Projects</a>
                                            <a href="#" class="delete" data-toggle="modal" data-target="#delete-dialog"><i class="fas fa-eraser" ></i> Delete</a>
                                        </div>
                                    </div>

                                </td>
                            </tr>
                        </tbody>

                    </table>

                </div>

            </div>

            <div class="tab-pane fade" id="nav-projects" role="tabpanel" aria-labelledby="nav-profile-tab">

                <div class="flip-scroll">

                    <table class="cf">
                        <thead>
                        <tr>
                            <th>
                                <label class="label--checkbox">
                                    <input type="checkbox" class="checkbox" data-container="body">
                                </label>
                            </th>
                            <th>Project Name</th>
                            <th>Project Owner</th>
                            <th>Team Members</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>
                                <label class="label--checkbox" >
                                    <input type="checkbox" class="checkbox">
                                </label>
                            </td>
                            <td>
                                <p>0127 Chaulden Lane</p>
                            </td>
                            <td>Alessandra di Simone</td>
                            <td>

                                <span class="team-member">
                                    <p>Manager 1</p>
                                    <a href="" class="remove"><i class="far fa-times-circle"></i></a>
                                </span>
                                <span class="team-member">
                                    <p>Alessandra di Simone</p>
                                    <a href="" class="remove"><i class="far fa-times-circle"></i></a>
                                </span>

                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label class="label--checkbox" >
                                    <input type="checkbox" class="checkbox">
                                </label>
                            </td>
                            <td>
                                <p>Rober Dean</p>
                                <span class="manager">Manager</span>
                            </td>
                            <td>rob@mail.com</td>
                            <td>

                                <div class="btn-group">
                                    <a href="#" class="dropdown-toggle trigger" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-ellipsis-h"></i></a>
                                    <div class="dropdown-menu dropdown-menu-right user-actions">
                                        <a href="#" class="edit"><i class="far fa-edit"></i> Assign Projects</a>
                                        <a href="#" class="delete" data-toggle="modal" data-target="#delete-dialog"><i class="fas fa-eraser" ></i> Delete</a>
                                    </div>
                                </div>

                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label class="label--checkbox" >
                                    <input type="checkbox" class="checkbox">
                                </label>
                            </td>
                            <td>
                                <p>Florin Berdila</p>
                                <span class="assistant">Assistant</span>
                            </td>
                            <td>florin@mail.com</td>
                            <td>

                                <div class="btn-group">
                                    <a href="#" class="dropdown-toggle trigger" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-ellipsis-h"></i></a>
                                    <div class="dropdown-menu dropdown-menu-right user-actions">
                                        <a href="#" class="edit"><i class="far fa-edit"></i> Assign Projects</a>
                                        <a href="#" class="delete" data-toggle="modal" data-target="#delete-dialog"><i class="fas fa-eraser" ></i> Delete</a>
                                    </div>
                                </div>

                            </td>
                        </tr>
                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    </div>

</div>
