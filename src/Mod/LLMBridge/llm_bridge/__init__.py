# SPDX-License-Identifier: LGPL-2.1-or-later
# LLM Bridge package

from .query_handlers import (
    handle_document_overview,
    handle_object_details,
    handle_selection,
    handle_dependencies,
    handle_list_objects,
    handle_get_object_properties,
    handle_get_document_info,
)

from .property_handlers import (
    handle_set_object_property,
    handle_update_dimensions,
    handle_move_object,
    handle_rotate_object,
    handle_scale_object,
    handle_set_expression,
    handle_get_expression,
    handle_clear_expression,
)

from .sketcher_handlers import (
    handle_create_sketch,
    handle_add_geometry,
    handle_add_geometric_constraint,
    handle_add_dimensional_constraint,
    handle_set_constraint_value,
    handle_list_sketch_constraints,
    handle_delete_constraint,
    handle_get_sketch_geometry,
)

from .feature_handlers import (
    handle_create_pad,
    handle_create_pocket,
    handle_create_revolution,
    handle_create_groove,
    handle_create_fillet,
    handle_create_chamfer,
    handle_create_body,
    handle_set_active_body,
    handle_list_bodies,
    handle_update_feature,
    handle_replace_sketch,
    handle_delete_feature,
)

__all__ = [
    'handle_document_overview',
    'handle_object_details',
    'handle_selection',
    'handle_dependencies',
    'handle_list_objects',
    'handle_get_object_properties',
    'handle_get_document_info',
    'handle_set_object_property',
    'handle_update_dimensions',
    'handle_move_object',
    'handle_rotate_object',
    'handle_scale_object',
    'handle_set_expression',
    'handle_get_expression',
    'handle_clear_expression',
    'handle_create_sketch',
    'handle_add_geometry',
    'handle_add_geometric_constraint',
    'handle_add_dimensional_constraint',
    'handle_set_constraint_value',
    'handle_list_sketch_constraints',
    'handle_delete_constraint',
    'handle_get_sketch_geometry',
    'handle_create_pad',
    'handle_create_pocket',
    'handle_create_revolution',
    'handle_create_groove',
    'handle_create_fillet',
    'handle_create_chamfer',
    'handle_create_body',
    'handle_set_active_body',
    'handle_list_bodies',
    'handle_update_feature',
    'handle_replace_sketch',
    'handle_delete_feature',
]

