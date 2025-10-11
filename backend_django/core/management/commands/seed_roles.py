from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from core.models import (
    Equipment, ProductionRecord, Expense, Invoice, License, 
    InsurancePolicy, CompanyCertificate, MOU, FinancialStatement, Attendance, CostingCenter
)

class Command(BaseCommand):
    help = 'Create user groups and assign permissions (Admin, Manager, Accountant, Foreman)'

    def handle(self, *args, **options):
        # Define roles and their permissions
        role_permissions = {
            'Admin': {
                'description': 'Full system access',
                'permissions': 'all'
            },
            'Manager': {
                'description': 'Management level access - view, add, change most entities',
                'models': [Equipment, ProductionRecord, Expense, Invoice, License, 
                          InsurancePolicy, CompanyCertificate, MOU, FinancialStatement, 
                          Attendance, CostingCenter],
                'permissions': ['view', 'add', 'change']
            },
            'Accountant': {
                'description': 'Financial focus - full access to expenses, invoices, financial statements',
                'full_access': [Expense, Invoice, FinancialStatement],
                'view_only': [Equipment, ProductionRecord, License, InsurancePolicy, 
                             CompanyCertificate, MOU, Attendance, CostingCenter],
                'permissions': ['view', 'add', 'change']
            },
            'Foreman': {
                'description': 'Operations focus - production, attendance, equipment view',
                'full_access': [ProductionRecord, Attendance],
                'limited_access': [Expense],
                'view_only': [Equipment, CostingCenter],
                'permissions': ['view', 'add']
            }
        }

        for role_name, role_config in role_permissions.items():
            # Create or get the group
            group, created = Group.objects.get_or_create(name=role_name)
            
            if created:
                self.stdout.write(f"Created group: {role_name}")
            else:
                self.stdout.write(f"Group exists: {role_name}")
                # Clear existing permissions to reset
                group.permissions.clear()

            # Assign permissions based on role
            if role_config.get('permissions') == 'all':
                # Admin gets all permissions
                all_permissions = Permission.objects.all()
                group.permissions.set(all_permissions)
                self.stdout.write(f"  ✅ Assigned all permissions to {role_name}")
                
            else:
                permissions_to_assign = []
                
                # Full access models
                full_access_models = role_config.get('full_access', [])
                for model in full_access_models:
                    ct = ContentType.objects.get_for_model(model)
                    for action in ['add', 'change', 'delete', 'view']:
                        perm = Permission.objects.filter(
                            content_type=ct,
                            codename__startswith=action
                        ).first()
                        if perm:
                            permissions_to_assign.append(perm)
                
                # Limited access (specified permissions only)
                limited_models = role_config.get('models', [])
                allowed_actions = role_config.get('permissions', ['view'])
                for model in limited_models:
                    ct = ContentType.objects.get_for_model(model)
                    for action in allowed_actions:
                        perm = Permission.objects.filter(
                            content_type=ct,
                            codename__startswith=action
                        ).first()
                        if perm:
                            permissions_to_assign.append(perm)
                
                # View only models
                view_only_models = role_config.get('view_only', [])
                for model in view_only_models:
                    ct = ContentType.objects.get_for_model(model)
                    perm = Permission.objects.filter(
                        content_type=ct,
                        codename__startswith='view'
                    ).first()
                    if perm:
                        permissions_to_assign.append(perm)
                
                # Limited access models (specific models with limited permissions)
                limited_access_models = role_config.get('limited_access', [])
                for model in limited_access_models:
                    ct = ContentType.objects.get_for_model(model)
                    for action in ['view', 'add']:  # Limited to view and add only
                        perm = Permission.objects.filter(
                            content_type=ct,
                            codename__startswith=action
                        ).first()
                        if perm:
                            permissions_to_assign.append(perm)
                
                # Assign the permissions
                if permissions_to_assign:
                    group.permissions.set(permissions_to_assign)
                    self.stdout.write(f"  ✅ Assigned {len(permissions_to_assign)} permissions to {role_name}")
                else:
                    self.stdout.write(f"  ⚠️  No permissions assigned to {role_name}")

        self.stdout.write(self.style.SUCCESS('\n🎉 Successfully created/updated all user roles and permissions!'))
        self.stdout.write('\nRole Summary:')
        self.stdout.write('👑 Admin: Full system access')
        self.stdout.write('👨‍💼 Manager: Management level access to most entities')
        self.stdout.write('💼 Accountant: Financial focus with expenses and invoices')
        self.stdout.write('👷 Foreman: Operations focus with production and attendance')