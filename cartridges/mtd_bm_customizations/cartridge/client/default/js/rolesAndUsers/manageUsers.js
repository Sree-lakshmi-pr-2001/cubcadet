'use strict';

// eslint-disable-next-line no-unused-vars
var existingRoles = {};

// eslint-disable-next-line require-jsdoc
function getAllExistingRoles() {
    // EpcotAdmin-AjaxGetSfccRoles
    jQuery.ajax({
        type: 'GET',
        url: '/on/demandware.store/Sites-Site/default/EpcotAdmin-AjaxGetSfccRoles',
        data: null,
        success: function (sfccRolesResult) {
            existingRoles = sfccRolesResult;
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

$(function () {
    console.log('window -> on load');
    getAllExistingRoles();
    $(document).ready(function () {
        // eslint-disable-next-line new-cap
        $('#pagination').DataTable();
    });
});

// eslint-disable-next-line require-jsdoc
function showUserEditModal(email) {
    $('#userEditModal').find('#editUserContainer').empty();
    $('#userEditModal').modal('show');

    // get info for modal
    document.getElementById('editUserContainer').innerHTML = 'Loading User...';
    var data = { email: email };
    jQuery.ajax({
        type: 'GET',
        url: '/on/demandware.store/Sites-Site/default/EpcotAdmin-AjaxGetSfccUser',
        data: data,
        success: function (sfccUser) {
            document.getElementById('editUserContainer').innerHTML = '';

            var userTemplate = document.getElementById('user-template');
            var user = document.getElementById('editUserContainer');
            var userInstance = document.importNode(userTemplate.content, true);
            userInstance.querySelector('.templateTitle').textContent = 'Edit SFCC User';
            userInstance.querySelector('.editEmail').textContent = sfccUser.email;
            userInstance.querySelector('.editActive').value = !!sfccUser.active;
            userInstance.querySelector('.userId').textContent = sfccUser.id;

            existingRoles.roles.forEach(function (role) {
                var rolesTemplate = document.getElementById('roles-template');
                var rolesInstance = document.importNode(rolesTemplate.content, true);
                var rowHeader = userInstance.querySelector('.rolesHeader');
                rolesInstance.querySelector('.roleId').id = role.id;
                // eslint-disable-next-line array-callback-return
                if (sfccUser.roles.find(item => item.id === role.id)) {
                    // role was found
                    rolesInstance.querySelector('.roleBoolean').checked = true;
                    rolesInstance.querySelector('.roleDescription').textContent = role.description;
                } else {
                    rolesInstance.querySelector('.roleBoolean').checked = false;
                    rolesInstance.querySelector('.roleDescription').textContent = role.description;
                }
                rowHeader.after(rolesInstance);
            });
            sfccUser.settings.forEach(function (userSetting) {
                var userSettingTemplate = document.getElementById('user-settings-template');
                var userSettingsInstance = document.importNode(userSettingTemplate.content, true);
                var rowHeader = userInstance.querySelector('.editUserSettingsHeader');
                userSettingsInstance.querySelector('.settingName').textContent = userSetting.name;
                userSettingsInstance.querySelector('.settingValue').value = userSetting.value;
                rowHeader.after(userSettingsInstance);
            });
            user.appendChild(userInstance);
            document.getElementById('userIdRow').style.display = 'none';
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

// eslint-disable-next-line require-jsdoc
function showCreateUserModal() {
    $('#userCreationModal').find('#createUserContainer').empty();
    $('#userCreationModal').modal('show');
    var createUserTemplate = document.getElementById('create-user-template');
    var createUser = document.getElementById('createUserContainer');
    var createUserInstance = document.importNode(createUserTemplate.content, true);
    createUserInstance.querySelector('.create-user-templateTitle').textContent = 'Create New SFCC User';
    existingRoles.roles.forEach(function (role) {
        var rolesTemplate = document.getElementById('create-user-roles-template');
        var rolesInstance = document.importNode(rolesTemplate.content, true);
        var rowHeader = createUserInstance.querySelector('.create-user-rolesHeader');
        rolesInstance.querySelector('.create-user-roleBoolean').checked = false;
        rolesInstance.querySelector('.create-user-roleId').id = 'create-user-' + role.id;
        rolesInstance.querySelector('.create-user-roleDescription').textContent = role.description;
        rowHeader.after(rolesInstance);
    });
    // hard coded user settings
    var userSettingTemplate = document.getElementById('create-user-settings-template');
    var userSettingsInstance = document.importNode(userSettingTemplate.content, true);
    var rowHeader = createUserInstance.querySelector('.create-user-settingsHeader');
    userSettingsInstance.querySelector('.create-user-settingName').textContent = 'New Voice Media ID';
    userSettingsInstance.querySelector('.create-user-settingValue').value = '-1';
    rowHeader.after(userSettingsInstance);
    createUser.appendChild(createUserInstance);
    document.getElementById('create-user-userIdRow').style.display = 'none';
}

// eslint-disable-next-line require-jsdoc
function updateSfccUser(email, activeStatus, roles, id, settingsNamesArray, settingsValueArray) {
    var formattedRoles = '';
    var formattedSettingNames = '';
    var formattedSettingValues = '';
    if (roles.length === 0) {
        formattedRoles = 'removeRoles';
    }
    while (roles.length > 0) {
        var currentRole = roles.shift();
        formattedRoles += '&roles[]=' + currentRole;
    }
    while (settingsNamesArray.length > 0) {
        var currentSettingName = settingsNamesArray.shift();
        formattedSettingNames += '&settingName[]=' + encodeURIComponent(currentSettingName.textContent);
    }
    while (settingsValueArray.length > 0) {
        var currentValue = settingsValueArray.shift();
        formattedSettingValues += '&settingValue[]=' + currentValue.value;
    }
    var data = {
        email: email,
        activeStatus: activeStatus,
        roles: formattedRoles,
        id: id,
        settingNames: formattedSettingNames,
        settingValues: formattedSettingValues
    };
    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotAdmin-AjaxPutSfccUser',
        data: data,
        success: function () {
            $('#userEditModal').modal('hide');
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

// eslint-disable-next-line require-jsdoc
function createNewSfccUser(email, activeStatus, roles, settingName, settingValue) {
    console.log('email : ' + email);
    console.log('active status : ' + activeStatus);
    console.log('Roles being submitted : ' + roles);
    console.log('Setting name : ' + settingName);
    console.log('Setting value : ' + settingValue);

    var formattedRoles = '';
    // While Creating the User , if do no assign any role , it should not through the error
    if (roles.length === 0) {
        formattedRoles = 'removeRoles';
    }
    while (roles.length > 0) {
        var currentRole = roles.shift();
        formattedRoles += '&roles[]=' + currentRole;
    }

    var data = {
        email: email,
        activeStatus: activeStatus,
        roles: formattedRoles,
        settingName: encodeURIComponent(settingName),
        settingValue: encodeURIComponent(settingValue)
    };

    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotAdmin-AjaxPostSfccUser',
        data: data,
        success: function () {
            $('#userCreationModal').modal('hide');
            location.reload();
            return false;
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        }
    });
}

module.exports = {
    methods: {
        showUserEditModal: showUserEditModal,
        getAllExistingRoles: getAllExistingRoles,
        showCreateUserModal: showCreateUserModal,
        createNewSfccUser: createNewSfccUser,
        updateSfccUser: updateSfccUser
    },

    showUserDetails: function () {
        $('#pagination').on('click', 'button', function (e) {
            e.preventDefault();
            showUserEditModal(this.id);
        });
    },
    createNewUser: function () {
        $('#newUserDiv').on('click', 'button', function (e) {
            e.preventDefault();
            showCreateUserModal();
        });
    },
    submitNewUser: function () {
        $('#submitNewUser').on('click', 'button', function (e) {
            e.preventDefault();
            var email = document.getElementById('create-user-emailAddress').value;
            if (email === '') {
                alert('Email address cannot be blank');
                return;
            }
            var activeStatus = document.getElementById('create-user-activeStatus').value;
            if (activeStatus === 'true') {
                activeStatus = 1;
            } else {
                activeStatus = 0;
            }
            var roles = [];
            existingRoles.roles.forEach(function (role) {
                var roleToPull = 'create-user-' + role.id;
                var currentRowSelection = document.getElementById(roleToPull).getElementsByClassName('create-user-roleBoolean')[0].checked;
                if (currentRowSelection === true) {
                    roles.push(role.id);
                }
            });

            var settingsListExists = document.getElementById('create-user-settingsList');
            var settingName = null;
            var settingValue = null;
            if (settingsListExists) {
                settingName = document.getElementById('create-user-settingName').textContent;
                settingValue = document.getElementById('create-user-settingValue').value;
            }
            createNewSfccUser(email, activeStatus, roles, settingName, settingValue);
        });
    },
    editUser: function () {
        $('#updateUser').on('click', 'button', function (e) {
            e.preventDefault();
            var email = document.getElementById('editEmail').textContent;
            if (email === '') {
                alert('Email address cannot be blank');
                return;
            }
            var activeStatus = document.getElementById('editActive').value;
            if (activeStatus === 'true') {
                activeStatus = 1;
            } else {
                activeStatus = 0;
            }
            var roles = [];
            existingRoles.roles.forEach(function (role) {
                var currentRowSelection = document.getElementById(role.id).getElementsByClassName('roleBoolean')[0].checked;
                if (currentRowSelection === true) {
                    roles.push(role.id);
                }
            });

            var id = document.getElementById('userId').textContent;
            // var settingsNames = [];
            // var settingsValues = [];
            var settingsNameArray = Array.from(document.getElementsByClassName('settingName'));
            var settingsValueArray = Array.from(document.getElementsByClassName('settingValue'));
            // var settingsListExists = document.getElementById('settingsList');
            // var settingName = null;
            // var settingValue = null;
            // var id = null;
            // if (settingsListExists) {
            //     settingName = document.getElementById('settingName').textContent;
            //     settingValue = document.getElementById('settingValue').value;
            //     id = document.getElementById('userId').textContent;
            //     console.log(settingName, settingValue, id);
            // }
            updateSfccUser(email, activeStatus, roles, id, settingsNameArray, settingsValueArray);
        });
    },

    filterUserOn: function () {
        $('#filterDataOn').on('click', function (e) {
            e.preventDefault();
            // eslint-disable-next-line new-cap
            var table = $('#pagination').DataTable();
            table.column(1).search('^Active$', true, false).draw();
            var onButton = document.getElementById('filterDataOn');
            onButton.style.display = 'none';
            var offButton = document.getElementById('filterDataOff');
            offButton.style.display = 'block';
        });
    },

    filterUserOff: function () {
        $('#filterDataOff').on('click', function (e) {
            e.preventDefault();
            // eslint-disable-next-line new-cap
            var table = $('#pagination').DataTable();
            table.column(1).search('Active').draw();
            var offButton = document.getElementById('filterDataOff');
            offButton.style.display = 'none';
            var onButton = document.getElementById('filterDataOn');
            onButton.style.display = 'block';
        });
    }
};
