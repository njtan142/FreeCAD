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
]

