# SPDX-License-Identifier: LGPL-2.1-or-later
# Animation Export Handlers
#
# Provides handlers for animation capture and video export:
# - Frame capture for animation sequences
# - Video encoding (MP4, WebM)
# - GIF creation
# - Full animation export workflow
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import FreeCADGui as Gui
import os
import time
import tempfile


_animation_capture_state = {
    "active": False,
    "output_dir": None,
    "fps": 30,
    "frames": [],
    "start_time": None,
    "frame_count": 0,
}


def _get_active_view():
    """Get the active 3D view."""
    try:
        return Gui.ActiveDocument.ActiveView
    except Exception:
        return None


def _capture_view_to_file(output_path, width=1920, height=1080):
    """Capture the current view to a file."""
    view = _get_active_view()
    if view is None:
        return False

    try:
        from PySide import QtGui

        pixmap = QtGui.QPixmap.grabWidget(view.getPyHandle())
        if not pixmap.isNull():
            pixmap.save(output_path)
            return True
    except Exception:
        pass

    try:
        view.saveImage(output_path, width, height, "CoverageImage")
        return os.path.exists(output_path)
    except Exception:
        pass

    return False


def _encode_video_ffmpeg(
    frame_pattern, output_path, fps, codec="libx264", quality=None
):
    """Encode video using FFmpeg."""
    try:
        import subprocess

        if quality == "high":
            crf = "18"
        elif quality == "medium":
            crf = "23"
        elif quality == "low":
            crf = "28"
        else:
            crf = "23"

        if codec == "libvpx":
            cmd = [
                "ffmpeg",
                "-y",
                "-framerate",
                str(fps),
                "-i",
                frame_pattern,
                "-c:v",
                "libvpx",
                "-crf",
                crf,
                "-b:v",
                "0",
                output_path,
            ]
        else:
            cmd = [
                "ffmpeg",
                "-y",
                "-framerate",
                str(fps),
                "-i",
                frame_pattern,
                "-c:v",
                codec,
                "-crf",
                crf,
                "-pix_fmt",
                "yuv420p",
                output_path,
            ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        return result.returncode == 0 and os.path.exists(output_path)
    except Exception:
        return False


def _encode_video_opencv(frame_pattern, output_path, fps, codec="mp4v"):
    """Encode video using OpenCV."""
    try:
        import cv2
        import glob

        frame_files = sorted(glob.glob(frame_pattern))
        if not frame_files:
            return False

        first_frame = cv2.imread(frame_files[0])
        if first_frame is None:
            return False

        height, width = first_frame.shape[:2]

        fourcc_map = {
            "mp4v": cv2.VideoWriter_fourcc(*"mp4v"),
            "avc1": cv2.VideoWriter_fourcc(*"avc1"),
            "XVID": cv2.VideoWriter_fourcc(*"XVID"),
            "webm": cv2.VideoWriter_fourcc(*"webm"),
        }

        fourcc = fourcc_map.get(codec, cv2.VideoWriter_fourcc(*"mp4v"))

        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        if not writer.isOpened():
            return False

        for frame_file in frame_files:
            frame = cv2.imread(frame_file)
            if frame is not None:
                writer.write(frame)

        writer.release()

        return os.path.exists(output_path)
    except Exception:
        return False


def _encode_video_imageio(frame_pattern, output_path, fps, quality=None):
    """Encode video using imageio."""
    try:
        import imageio.v3 as iio
        import glob

        frame_files = sorted(glob.glob(frame_pattern))
        if not frame_files:
            return False, "No frames found"

        if quality == "high":
            quality_value = 8
        elif quality == "medium":
            quality_value = 5
        else:
            quality_value = 5

        output_path = os.path.expanduser(output_path)

        images = []
        for frame_file in frame_files:
            img = iio.imread(frame_file)
            images.append(img)

        iio.imwrite(output_path, images, fps=fps, quality=quality_value)

        return os.path.exists(output_path), None
    except Exception as e:
        return False, str(e)


def _create_gif_pillow(frame_pattern, output_path, duration=None, loop=0):
    """Create GIF using PIL/Pillow."""
    try:
        from PIL import Image
        import glob

        frame_files = sorted(glob.glob(frame_pattern))
        if not frame_files:
            return False, "No frames found"

        images = []
        for frame_file in frame_files:
            img = Image.open(frame_file)
            if img.mode == "RGBA":
                background = Image.new("RGB", img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")
            images.append(img)

        if not images:
            return False, "No valid images"

        if duration is not None:
            total_duration = duration * 1000
            frame_duration = total_duration / len(images)
        else:
            frame_duration = 100

        output_path = os.path.expanduser(output_path)

        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=int(frame_duration),
            loop=loop,
        )

        return os.path.exists(output_path), None
    except Exception as e:
        return False, str(e)


def handle_start_animation_capture(output_dir, fps=30):
    """
    Start capturing animation frames.

    Args:
        output_dir: Directory to save captured frames
        fps: Frames per second (default 30)

    Returns:
        dict with success status, output directory, fps, and message
    """
    try:
        global _animation_capture_state

        if _animation_capture_state["active"]:
            return {
                "success": False,
                "error": "Animation capture already in progress. Stop it first.",
                "data": None,
            }

        capture_dir = os.path.expanduser(str(output_dir))
        if not os.path.exists(capture_dir):
            os.makedirs(capture_dir)

        _animation_capture_state["active"] = True
        _animation_capture_state["output_dir"] = capture_dir
        _animation_capture_state["fps"] = int(fps)
        _animation_capture_state["frames"] = []
        _animation_capture_state["start_time"] = time.time()
        _animation_capture_state["frame_count"] = 0

        return {
            "success": True,
            "data": {
                "outputDir": capture_dir,
                "fps": fps,
                "message": f"Animation capture started at {fps}fps to {capture_dir}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_capture_frame():
    """
    Capture a single frame from the current view.

    Returns:
        dict with success status, frame number, and message
    """
    try:
        global _animation_capture_state

        if not _animation_capture_state["active"]:
            return {
                "success": False,
                "error": "No animation capture in progress. Use handle_start_animation_capture first.",
                "data": None,
            }

        output_dir = _animation_capture_state["output_dir"]
        frame_count = _animation_capture_state["frame_count"]

        frame_path = os.path.join(output_dir, f"frame_{frame_count:06d}.png")

        if _capture_view_to_file(frame_path):
            _animation_capture_state["frames"].append(frame_path)
            _animation_capture_state["frame_count"] += 1

            return {
                "success": True,
                "data": {
                    "frameNumber": frame_count,
                    "framePath": frame_path,
                    "totalFrames": _animation_capture_state["frame_count"],
                    "message": f"Captured frame {frame_count}",
                },
            }
        else:
            return {
                "success": False,
                "error": "Failed to capture frame",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_stop_animation_capture(output_path, format="mp4", quality=None):
    """
    Stop animation capture and encode to video.

    Args:
        output_path: Path for the output video file
        format: Video format ('mp4', 'webm', 'gif')
        quality: Quality preset ('high', 'medium', 'low')

    Returns:
        dict with success status, output path, format, total frames, and message
    """
    try:
        global _animation_capture_state

        if not _animation_capture_state["active"]:
            return {
                "success": False,
                "error": "No animation capture in progress",
                "data": None,
            }

        output_dir = _animation_capture_state["output_dir"]
        fps = _animation_capture_state["fps"]
        frames = _animation_capture_state["frames"]
        total_frames = len(frames)

        _animation_capture_state["active"] = False

        if total_frames == 0:
            return {
                "success": False,
                "error": "No frames captured",
                "data": None,
            }

        output_path = os.path.expanduser(str(output_path))
        output_dir_out = os.path.dirname(output_path) or "."
        if output_dir_out and not os.path.exists(output_dir_out):
            os.makedirs(output_dir_out)

        format_lower = format.lower()
        frame_pattern = os.path.join(output_dir, "frame_%06d.png")

        success = False

        if format_lower == "gif":
            success, error = _create_gif_pillow(frame_pattern, output_path)
        else:
            codec = "libx264" if format_lower == "mp4" else "libvpx"

            if os.path.exists("/usr/bin/ffmpeg") or os.path.exists(
                "/usr/local/bin/ffmpeg"
            ):
                success = _encode_video_ffmpeg(
                    frame_pattern, output_path, fps, codec, quality
                )
            else:
                try:
                    success, error = _encode_video_imageio(
                        frame_pattern, output_path, fps, quality
                    )
                    if not success:
                        success = _encode_video_opencv(
                            frame_pattern, output_path, fps, codec
                        )
                except Exception:
                    success = _encode_video_opencv(
                        frame_pattern, output_path, fps, codec
                    )

        if success:
            return {
                "success": True,
                "data": {
                    "outputPath": output_path,
                    "format": format_lower,
                    "totalFrames": total_frames,
                    "fps": fps,
                    "message": f"Animation exported: {output_path} ({total_frames} frames, {fps}fps)",
                },
            }
        else:
            return {
                "success": False,
                "error": f"Failed to encode {format_lower} video",
                "data": None,
            }
    except Exception as e:
        _animation_capture_state["active"] = False
        return {"success": False, "error": str(e), "data": None}


def handle_export_animation(
    assembly_name, output_path, format="mp4", duration=5, fps=30
):
    """
    Export a full animation of an assembly as video.

    Args:
        assembly_name: Name of the assembly to animate
        output_path: Path for the output video file
        format: Video format ('mp4', 'webm', 'gif')
        duration: Duration in seconds (default 5)
        fps: Frames per second (default 30)

    Returns:
        dict with success status, output path, format, duration, total frames, and message
    """
    try:
        from .kinematic_handlers import _kinematic_state, _get_assembly_object

        if not _kinematic_state.get("joint_drives"):
            return {
                "success": False,
                "error": "No joint drives configured. Use handle_add_drive first.",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        assembly = _get_assembly_object(doc, assembly_name)
        if assembly is None:
            return {
                "success": False,
                "error": f"Assembly '{assembly_name}' not found",
                "data": None,
            }

        with tempfile.TemporaryDirectory() as temp_dir:
            capture_result = handle_start_animation_capture(temp_dir, fps)
            if not capture_result["success"]:
                return capture_result

            total_frames = int(duration * fps)
            frame_duration = 1.0 / fps

            from .kinematic_handlers import (
                _set_joint_value_internal,
                _get_joint_value_internal,
            )

            for frame in range(total_frames):
                t = frame / float(total_frames)

                for joint_name, drive in _kinematic_state["joint_drives"].items():
                    joint_obj = doc.getObject(joint_name)
                    if joint_obj is None:
                        continue

                    start_val = drive["start_value"]
                    end_val = drive["end_value"]
                    motion_type = drive["motion_type"]

                    if motion_type == "linear":
                        eased = t
                    elif motion_type == "ease_in_out":
                        if t < 0.5:
                            eased = 2 * t * t
                        else:
                            eased = 1 - pow(-2 * t + 2, 2) / 2
                    elif motion_type == "sine":
                        eased = (1 - math.cos(t * math.pi)) / 2
                    else:
                        eased = t

                    value = start_val + (end_val - start_val) * eased
                    _set_joint_value_internal(joint_obj, value)

                doc.recompute()

                frame_result = handle_capture_frame()
                if not frame_result["success"]:
                    pass

            result = handle_stop_animation_capture(output_path, format)

            if result["success"]:
                result["data"]["duration"] = duration
                result["data"]["assemblyName"] = assembly_name

            return result
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_gif(input_pattern, output_path, duration=None, loop=0):
    """
    Create a GIF from a sequence of images.

    Args:
        input_pattern: Glob pattern for input frames (e.g., '/path/frame_*.png')
        output_path: Path for the output GIF file
        duration: Total duration in seconds (if None, uses frame timing)
        loop: Number of loops (0 = infinite)

    Returns:
        dict with success status, output path, frame count, and message
    """
    try:
        input_pattern = os.path.expanduser(str(input_pattern))
        output_path = os.path.expanduser(str(output_path))

        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        success, error = _create_gif_pillow(input_pattern, output_path, duration, loop)

        if success:
            import glob

            frame_files = glob.glob(input_pattern)
            frame_count = len(frame_files)

            return {
                "success": True,
                "data": {
                    "outputPath": output_path,
                    "frameCount": frame_count,
                    "duration": duration,
                    "loop": loop,
                    "message": f"Created GIF: {output_path} ({frame_count} frames)",
                },
            }
        else:
            return {
                "success": False,
                "error": error or "Failed to create GIF",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_animation_capture_state():
    """
    Get the current animation capture state.

    Returns:
        dict with success status, active status, frame count, fps, and message
    """
    try:
        global _animation_capture_state

        active = _animation_capture_state["active"]
        frame_count = _animation_capture_state["frame_count"]
        fps = _animation_capture_state["fps"]
        output_dir = _animation_capture_state["output_dir"]

        if active and _animation_capture_state["start_time"]:
            elapsed = time.time() - _animation_capture_state["start_time"]
        else:
            elapsed = 0

        return {
            "success": True,
            "data": {
                "active": active,
                "frameCount": frame_count,
                "fps": fps,
                "outputDir": output_dir,
                "elapsedTime": elapsed,
                "message": f"{'Capturing' if active else 'Stopped'}: {frame_count} frames at {fps}fps",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_start_animation_capture",
    "handle_capture_frame",
    "handle_stop_animation_capture",
    "handle_export_animation",
    "handle_create_gif",
    "handle_get_animation_capture_state",
]
