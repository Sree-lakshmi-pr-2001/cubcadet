'use strict';

// eslint-disable-next-line require-jsdoc
function showRoleEditModal(selectedRole) {
    console.log('Showing edit modal for role with ID of : ' + selectedRole.id);
    $('#roleModal').find('#editRolesContainer').empty();
    $('#roleModal').modal('show');
    var roleCode = selectedRole.children[0].textContent;
    var roleDescription = selectedRole.children[1].textContent;
    var editRolesTemplate = document.getElementById('modal-edit-template');
    var editRoles = document.getElementById('editRolesContainer');
    var editRolesInstance = document.importNode(editRolesTemplate.content, true);
    editRolesInstance.querySelector('.editRoleCode').textContent = roleCode;
    editRolesInstance.querySelector('.editRoleDescription').value = roleDescription;
    editRoles.appendChild(editRolesInstance);
}


$(function () {
    console.log('window -> on load');
    $('#breadCrumbList').append('<li class="breadcrumb-item active" aria-current="page">Manage Roles</li>');
    $(document).ready(function () {
        // eslint-disable-next-line new-cap
        $('#pagination').DataTable();
    });
});

// eslint-disable-next-line require-jsdoc
function submitUpdatedRole(roleBeingChanged, newDescription) {
    console.log('submitting changes to role : ' + roleBeingChanged + ' with description : ' + newDescription);
    var data = {
        role: roleBeingChanged,
        description: encodeURIComponent(newDescription)
    };

    jQuery.ajax({
        type: 'POST',
        url: '/on/demandware.store/Sites-Site/default/EpcotAdmin-AjaxPutRole',
        data: data,
        success: function () {
            $('#userCreationModal').modal('hide');
        },
        error: function (req, status, error) {
            alert(req + ' ' + status + ' ' + error);
        },
        complete: function () {
            // refresh window
            location.reload();
            return false;
        }
    });
}

module.exports = {
    methods: {
        // getAllExistingRoles: getAllExistingRoles,
        showRoleEditModal: showRoleEditModal,
        submitUpdatedRole: submitUpdatedRole
    },
    showRoleDetails: function () {
        $('#roles').on('click', 'button', function (e) {
            e.preventDefault();
            // pass the row to the function to retrieve data from it
            showRoleEditModal(this.parentNode.parentNode);
        });
    },
    submitRoleEdit: function () {
        $('.submitButton').on('click', 'button', function (e) {
            e.preventDefault();
            var roleCode = document.getElementById('editRoleCode').textContent;
            var updatedRoleDescription = document.getElementById('editRoleDescription').value;
            $('#roleModal').modal('hide');
            submitUpdatedRole(roleCode, updatedRoleDescription);
        });
    }
};
