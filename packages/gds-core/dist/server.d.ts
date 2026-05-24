import * as react from 'react';
import { ReactNode } from 'react';
import * as _tabler_icons_react from '@tabler/icons-react';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { BadgeProps } from '@mantine/core';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
interface StatusBadgeProps extends Omit<BadgeProps, 'color'> {
    status: StatusVariant;
    children: ReactNode;
}
/**
 * StatusBadge enforces strict semantic coloring.
 * Arbitrary hex colors are prohibited.
 */
declare function StatusBadge({ status, children, ...props }: StatusBadgeProps): react_jsx_runtime.JSX.Element;

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}
/**
 * Standardized EmptyState component.
 */
declare function EmptyState({ icon, title, description, action }: EmptyStateProps): react_jsx_runtime.JSX.Element;

declare const GdsVocabulary: {
    readonly settings: {
        readonly id: "gds.action.settings";
        readonly defaultMessage: "Settings";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.saved";
        };
    };
    readonly analytics: {
        readonly id: "gds.action.analytics";
        readonly defaultMessage: "Analytics";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.loaded";
        };
    };
    readonly dashboard: {
        readonly id: "gds.action.dashboard";
        readonly defaultMessage: "Dashboard";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.loaded";
        };
    };
    readonly play: {
        readonly id: "gds.action.play";
        readonly defaultMessage: "Play";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.started";
        };
    };
    readonly start: {
        readonly id: "gds.action.start";
        readonly defaultMessage: "Start";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.started";
        };
    };
    readonly users: {
        readonly id: "gds.action.users";
        readonly defaultMessage: "Users";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.loaded";
        };
    };
    readonly add: {
        readonly id: "gds.action.add";
        readonly defaultMessage: "Add";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.added";
        };
    };
    readonly edit: {
        readonly id: "gds.action.edit";
        readonly defaultMessage: "Edit";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.edited";
        };
    };
    readonly delete: {
        readonly id: "gds.action.delete";
        readonly defaultMessage: "Delete";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "red";
            readonly messageId: "gds.feedback.deleted";
        };
    };
    readonly save: {
        readonly id: "gds.action.save";
        readonly defaultMessage: "Save";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.saved";
        };
    };
    readonly cancel: {
        readonly id: "gds.action.cancel";
        readonly defaultMessage: "Cancel";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "red";
            readonly messageId: "gds.feedback.canceled";
        };
    };
    readonly confirm: {
        readonly id: "gds.action.confirm";
        readonly defaultMessage: "Confirm";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.confirmed";
        };
    };
    readonly close: {
        readonly id: "gds.action.close";
        readonly defaultMessage: "Close";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "gray";
            readonly messageId: "gds.feedback.closed";
        };
    };
    readonly language: {
        readonly id: "gds.action.language";
        readonly defaultMessage: "Language";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.changed";
        };
    };
    readonly theme: {
        readonly id: "gds.action.theme";
        readonly defaultMessage: "Theme";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.changed";
        };
    };
    readonly home: {
        readonly id: "gds.action.home";
        readonly defaultMessage: "Home";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.opened";
        };
    };
    readonly inbox: {
        readonly id: "gds.action.inbox";
        readonly defaultMessage: "Inbox";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.opened";
        };
    };
    readonly calendar: {
        readonly id: "gds.action.calendar";
        readonly defaultMessage: "Calendar";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.opened";
        };
    };
    readonly gallery: {
        readonly id: "gds.action.gallery";
        readonly defaultMessage: "Gallery";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.opened";
        };
    };
    readonly history: {
        readonly id: "gds.action.history";
        readonly defaultMessage: "History";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.opened";
        };
    };
    readonly profile: {
        readonly id: "gds.action.profile";
        readonly defaultMessage: "Profile";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.opened";
        };
    };
    readonly send: {
        readonly id: "gds.action.send";
        readonly defaultMessage: "Send";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "blue";
            readonly messageId: "gds.feedback.sent";
        };
    };
    readonly reply: {
        readonly id: "gds.action.reply";
        readonly defaultMessage: "Reply";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "blue";
            readonly messageId: "gds.feedback.replied";
        };
    };
    readonly forward: {
        readonly id: "gds.action.forward";
        readonly defaultMessage: "Forward";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "blue";
            readonly messageId: "gds.feedback.forwarded";
        };
    };
    readonly attach: {
        readonly id: "gds.action.attach";
        readonly defaultMessage: "Attach";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.attached";
        };
    };
    readonly upload: {
        readonly id: "gds.action.upload";
        readonly defaultMessage: "Upload";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.uploaded";
        };
    };
    readonly download: {
        readonly id: "gds.action.download";
        readonly defaultMessage: "Download";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.downloaded";
        };
    };
    readonly print: {
        readonly id: "gds.action.print";
        readonly defaultMessage: "Print";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.printed";
        };
    };
    readonly copy: {
        readonly id: "gds.action.copy";
        readonly defaultMessage: "Copy";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.copied";
        };
    };
    readonly duplicate: {
        readonly id: "gds.action.duplicate";
        readonly defaultMessage: "Duplicate";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.duplicated";
        };
    };
    readonly check: {
        readonly id: "gds.action.check";
        readonly defaultMessage: "Check";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.checked";
        };
    };
    readonly uncheck: {
        readonly id: "gds.action.uncheck";
        readonly defaultMessage: "Uncheck";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "red";
            readonly messageId: "gds.feedback.unchecked";
        };
    };
    readonly complete: {
        readonly id: "gds.action.complete";
        readonly defaultMessage: "Complete";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.completed";
        };
    };
    readonly clear: {
        readonly id: "gds.action.clear";
        readonly defaultMessage: "Clear";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "red";
            readonly messageId: "gds.feedback.cleared";
        };
    };
    readonly capture: {
        readonly id: "gds.action.capture";
        readonly defaultMessage: "Capture";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.captured";
        };
    };
    readonly record: {
        readonly id: "gds.action.record";
        readonly defaultMessage: "Record";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.recorded";
        };
    };
    readonly flip: {
        readonly id: "gds.action.flip";
        readonly defaultMessage: "Flip";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.flipped";
        };
    };
    readonly flash: {
        readonly id: "gds.action.flash";
        readonly defaultMessage: "Flash";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.flashed";
        };
    };
    readonly course: {
        readonly id: "gds.action.course";
        readonly defaultMessage: "Course";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly lesson: {
        readonly id: "gds.action.lesson";
        readonly defaultMessage: "Lesson";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly certificate: {
        readonly id: "gds.action.certificate";
        readonly defaultMessage: "Certificate";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly student: {
        readonly id: "gds.action.student";
        readonly defaultMessage: "Student";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly class: {
        readonly id: "gds.action.class";
        readonly defaultMessage: "Class";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly grade: {
        readonly id: "gds.action.grade";
        readonly defaultMessage: "Grade";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly child: {
        readonly id: "gds.action.child";
        readonly defaultMessage: "Child";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly family: {
        readonly id: "gds.action.family";
        readonly defaultMessage: "Family";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly habit: {
        readonly id: "gds.action.habit";
        readonly defaultMessage: "Habit";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly goal: {
        readonly id: "gds.action.goal";
        readonly defaultMessage: "Goal";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly streak: {
        readonly id: "gds.action.streak";
        readonly defaultMessage: "Streak";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly reward: {
        readonly id: "gds.action.reward";
        readonly defaultMessage: "Reward";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "yellow";
            readonly messageId: "gds.feedback.rewarded";
        };
    };
    readonly trophy: {
        readonly id: "gds.action.trophy";
        readonly defaultMessage: "Trophy";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "yellow";
            readonly messageId: "gds.feedback.rewarded";
        };
    };
    readonly crown: {
        readonly id: "gds.action.crown";
        readonly defaultMessage: "Crown";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "yellow";
            readonly messageId: "gds.feedback.rewarded";
        };
    };
    readonly pause: {
        readonly id: "gds.action.pause";
        readonly defaultMessage: "Pause";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.paused";
        };
    };
    readonly message: {
        readonly id: "gds.action.message";
        readonly defaultMessage: "Message";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "blue";
            readonly messageId: "gds.feedback.sent";
        };
    };
    readonly mail: {
        readonly id: "gds.action.mail";
        readonly defaultMessage: "Mail";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "blue";
            readonly messageId: "gds.feedback.mailed";
        };
    };
    readonly refresh: {
        readonly id: "gds.action.refresh";
        readonly defaultMessage: "Refresh";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.refreshed";
        };
    };
    readonly trendingUp: {
        readonly id: "gds.action.trendingUp";
        readonly defaultMessage: "Trending Up";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly trendingDown: {
        readonly id: "gds.action.trendingDown";
        readonly defaultMessage: "Trending Down";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly currency: {
        readonly id: "gds.action.currency";
        readonly defaultMessage: "Currency";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly grid: {
        readonly id: "gds.action.grid";
        readonly defaultMessage: "Grid";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly list: {
        readonly id: "gds.action.list";
        readonly defaultMessage: "List";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly logout: {
        readonly id: "gds.action.logout";
        readonly defaultMessage: "Logout";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.loggedOut";
        };
    };
    readonly notifications: {
        readonly id: "gds.action.notifications";
        readonly defaultMessage: "Notifications";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly back: {
        readonly id: "gds.action.back";
        readonly defaultMessage: "Back";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly eye: {
        readonly id: "gds.action.eye";
        readonly defaultMessage: "View";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly eyeOff: {
        readonly id: "gds.action.eyeOff";
        readonly defaultMessage: "Hide";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly help: {
        readonly id: "gds.action.help";
        readonly defaultMessage: "Help";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.done";
        };
    };
    readonly filter: {
        readonly id: "gds.action.filter";
        readonly defaultMessage: "Filter";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.filtered";
        };
    };
    readonly sort: {
        readonly id: "gds.action.sort";
        readonly defaultMessage: "Sort";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.sorted";
        };
    };
    readonly export: {
        readonly id: "gds.action.export";
        readonly defaultMessage: "Export";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.exported";
        };
    };
    readonly import: {
        readonly id: "gds.action.import";
        readonly defaultMessage: "Import";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.imported";
        };
    };
    readonly preview: {
        readonly id: "gds.action.preview";
        readonly defaultMessage: "Preview";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.previewed";
        };
    };
    readonly clone: {
        readonly id: "gds.action.clone";
        readonly defaultMessage: "Clone";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.cloned";
        };
    };
    readonly restore: {
        readonly id: "gds.action.restore";
        readonly defaultMessage: "Restore";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.restored";
        };
    };
    readonly toggle: {
        readonly id: "gds.action.toggle";
        readonly defaultMessage: "Toggle";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.toggled";
        };
    };
    readonly search: {
        readonly id: "gds.action.search";
        readonly defaultMessage: "Search";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.searched";
        };
    };
    readonly submit: {
        readonly id: "gds.action.submit";
        readonly defaultMessage: "Submit";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.submitted";
        };
    };
    readonly reset: {
        readonly id: "gds.action.reset";
        readonly defaultMessage: "Reset";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "red";
            readonly messageId: "gds.feedback.reset";
        };
    };
    readonly login: {
        readonly id: "gds.action.login";
        readonly defaultMessage: "Login";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.loggedIn";
        };
    };
    readonly register: {
        readonly id: "gds.action.register";
        readonly defaultMessage: "Register";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.registered";
        };
    };
    readonly verify: {
        readonly id: "gds.action.verify";
        readonly defaultMessage: "Verify";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.verified";
        };
    };
    readonly launch: {
        readonly id: "gds.action.launch";
        readonly defaultMessage: "Launch";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "purple";
            readonly messageId: "gds.feedback.launched";
        };
    };
    readonly draft: {
        readonly id: "gds.action.draft";
        readonly defaultMessage: "Draft";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.drafted";
        };
    };
    readonly refer: {
        readonly id: "gds.action.refer";
        readonly defaultMessage: "Refer";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.referred";
        };
    };
    readonly evidence: {
        readonly id: "gds.action.evidence";
        readonly defaultMessage: "Evidence";
        readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
        readonly feedback: {
            readonly icon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
            readonly color: "teal";
            readonly messageId: "gds.feedback.added";
        };
    };
};
type SemanticAction = keyof typeof GdsVocabulary;

/**
 * GdsIcons is the centralized semantic icon dictionary.
 * Applications MUST use these exported icons instead of importing
 * raw icons from tabler/icons-react directly. This ensures complete
 * visual consistency across the platform.
 */
declare const GdsIcons: {
    Dashboard: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Settings: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Users: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Analytics: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Home: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Inbox: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Calendar: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Gallery: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    History: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Profile: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Add: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Edit: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Delete: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Search: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Save: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Play: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Start: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Send: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Reply: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Forward: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Attach: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Upload: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Download: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Print: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Copy: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Duplicate: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Check: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Uncheck: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Complete: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Clear: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Cancel: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Confirm: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Close: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Language: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Theme: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Capture: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Record: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Flip: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Flash: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Course: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Lesson: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Certificate: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Student: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Class: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Grade: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Child: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Family: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Habit: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Goal: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Streak: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Reward: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Success: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Warning: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Danger: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Info: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Trophy: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Crown: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Pause: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Message: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Mail: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Refresh: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    TrendingUp: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    TrendingDown: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Currency: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Grid: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    List: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Logout: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Notifications: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Back: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Eye: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    EyeOff: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Help: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Filter: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Sort: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Export: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Import: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Preview: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Clone: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Restore: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Toggle: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Submit: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Reset: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Login: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Register: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Verify: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Launch: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Draft: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Refer: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Evidence: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    ChevronDown: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    ChevronUp: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Menu: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Moon: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
    Sun: react.ForwardRefExoticComponent<_tabler_icons_react.IconProps & react.RefAttributes<SVGSVGElement>>;
};

interface MetricCardProps {
    label: string;
    value: ReactNode;
    description?: ReactNode;
    trend?: {
        label: string;
        tone?: 'positive' | 'negative' | 'neutral';
    };
    icon?: ReactNode;
    footer?: ReactNode;
}
declare function MetricCard({ label, value, description, trend, icon, footer }: MetricCardProps): react_jsx_runtime.JSX.Element;

interface ProgressCardProps {
    label: string;
    value: ReactNode;
    progress: number;
    progressLabel?: string;
    description?: ReactNode;
    action?: ReactNode;
}
declare function ProgressCard({ label, value, progress, progressLabel, description, action, }: ProgressCardProps): react_jsx_runtime.JSX.Element;

interface ProductCardMetaItem {
    label: string;
    value: ReactNode;
}
interface ProductCardAction {
    label: string;
    onClick?: () => void;
    href?: string;
    color?: string;
}
interface ProductCardProps {
    title: string;
    description?: ReactNode;
    media?: ReactNode;
    icon?: ReactNode;
    status?: ReactNode;
    metadata?: ProductCardMetaItem[];
    primaryAction?: ReactNode;
    secondaryActions?: ProductCardAction[];
    footer?: ReactNode;
}
declare function ProductCard({ title, description, media, icon, status, metadata, primaryAction, secondaryActions, footer, }: ProductCardProps): react_jsx_runtime.JSX.Element;

type StateBlockVariant = 'loading' | 'empty' | 'error' | 'permission' | 'disabled' | 'success' | 'info' | 'not-enough-data';
interface StateBlockProps {
    variant: StateBlockVariant;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
    compact?: boolean;
}
declare function StateBlock({ variant, title, description, action, icon, compact, }: StateBlockProps): react_jsx_runtime.JSX.Element;

interface DataToolbarFilterChip {
    label: string;
    onRemove?: () => void;
}
interface DataToolbarProps {
    searchSlot?: ReactNode;
    filterSlot?: ReactNode;
    sortSlot?: ReactNode;
    resetAction?: ReactNode;
    createAction?: ReactNode;
    activeFilters?: DataToolbarFilterChip[];
}
declare function DataToolbar({ searchSlot, filterSlot, sortSlot, resetAction, createAction, activeFilters, }: DataToolbarProps): react_jsx_runtime.JSX.Element;

interface PublicShellProps {
    brand: ReactNode;
    navigation?: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    mobileNavigation?: ReactNode;
    children: ReactNode;
    headerBordered?: boolean;
    compact?: boolean;
}
declare function PublicShell({ brand, navigation, actions, footer, mobileNavigation, children, headerBordered, compact, }: PublicShellProps): react_jsx_runtime.JSX.Element;

interface AuthShellProps {
    title: string;
    description?: ReactNode;
    brand?: ReactNode;
    footer?: ReactNode;
    helper?: ReactNode;
    children: ReactNode;
}
declare function AuthShell({ title, description, brand, footer, helper, children }: AuthShellProps): react_jsx_runtime.JSX.Element;

interface ArticleShellProps {
    eyebrow?: string;
    title: string;
    lead?: ReactNode;
    meta?: ReactNode;
    sideRail?: ReactNode;
    children: ReactNode;
}
declare function ArticleShell({ eyebrow, title, lead, meta, sideRail, children }: ArticleShellProps): react_jsx_runtime.JSX.Element;

interface MediaCardAction {
    label: string;
    onClick?: () => void;
}
interface MediaCardProps {
    title: string;
    image: ReactNode;
    description?: ReactNode;
    status?: string;
    overlay?: ReactNode;
    actions?: MediaCardAction[];
}
declare function MediaCard({ title, image, description, status, overlay, actions }: MediaCardProps): react_jsx_runtime.JSX.Element;

interface AccessSummaryProps {
    title: string;
    roles: string[];
    scope?: string;
    blocked?: boolean;
    description?: ReactNode;
}
declare function AccessSummary({ title, roles, scope, blocked, description }: AccessSummaryProps): react_jsx_runtime.JSX.Element;

declare const en: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.saved': string;
    'gds.feedback.error': string;
    'gds.feedback.added': string;
    'gds.feedback.edited': string;
    'gds.feedback.deleted': string;
    'gds.feedback.canceled': string;
    'gds.feedback.confirmed': string;
    'gds.feedback.closed': string;
    'gds.feedback.changed': string;
    'gds.feedback.loaded': string;
    'gds.feedback.started': string;
    'gds.feedback.opened': string;
    'gds.feedback.sent': string;
    'gds.feedback.replied': string;
    'gds.feedback.forwarded': string;
    'gds.feedback.attached': string;
    'gds.feedback.uploaded': string;
    'gds.feedback.downloaded': string;
    'gds.feedback.printed': string;
    'gds.feedback.copied': string;
    'gds.feedback.duplicated': string;
    'gds.feedback.checked': string;
    'gds.feedback.unchecked': string;
    'gds.feedback.completed': string;
    'gds.feedback.cleared': string;
    'gds.feedback.captured': string;
    'gds.feedback.recorded': string;
    'gds.feedback.flipped': string;
    'gds.feedback.flashed': string;
    'gds.feedback.done': string;
    'gds.feedback.rewarded': string;
    'gds.feedback.paused': string;
    'gds.feedback.mailed': string;
    'gds.feedback.refreshed': string;
    'gds.feedback.loggedOut': string;
    'gds.feedback.filtered': string;
    'gds.feedback.sorted': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

declare const hu: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.saved': string;
    'gds.feedback.error': string;
    'gds.feedback.added': string;
    'gds.feedback.edited': string;
    'gds.feedback.deleted': string;
    'gds.feedback.canceled': string;
    'gds.feedback.confirmed': string;
    'gds.feedback.closed': string;
    'gds.feedback.changed': string;
    'gds.feedback.loaded': string;
    'gds.feedback.started': string;
    'gds.feedback.opened': string;
    'gds.feedback.sent': string;
    'gds.feedback.replied': string;
    'gds.feedback.forwarded': string;
    'gds.feedback.attached': string;
    'gds.feedback.uploaded': string;
    'gds.feedback.downloaded': string;
    'gds.feedback.printed': string;
    'gds.feedback.copied': string;
    'gds.feedback.duplicated': string;
    'gds.feedback.checked': string;
    'gds.feedback.unchecked': string;
    'gds.feedback.completed': string;
    'gds.feedback.cleared': string;
    'gds.feedback.captured': string;
    'gds.feedback.recorded': string;
    'gds.feedback.flipped': string;
    'gds.feedback.flashed': string;
    'gds.feedback.done': string;
    'gds.feedback.rewarded': string;
    'gds.feedback.paused': string;
    'gds.feedback.mailed': string;
    'gds.feedback.refreshed': string;
    'gds.feedback.loggedOut': string;
    'gds.feedback.filtered': string;
    'gds.feedback.sorted': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

declare const de: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.saved': string;
    'gds.feedback.error': string;
    'gds.feedback.added': string;
    'gds.feedback.edited': string;
    'gds.feedback.deleted': string;
    'gds.feedback.canceled': string;
    'gds.feedback.confirmed': string;
    'gds.feedback.closed': string;
    'gds.feedback.changed': string;
    'gds.feedback.loaded': string;
    'gds.feedback.started': string;
    'gds.feedback.opened': string;
    'gds.feedback.sent': string;
    'gds.feedback.replied': string;
    'gds.feedback.forwarded': string;
    'gds.feedback.attached': string;
    'gds.feedback.uploaded': string;
    'gds.feedback.downloaded': string;
    'gds.feedback.printed': string;
    'gds.feedback.copied': string;
    'gds.feedback.duplicated': string;
    'gds.feedback.checked': string;
    'gds.feedback.unchecked': string;
    'gds.feedback.completed': string;
    'gds.feedback.cleared': string;
    'gds.feedback.captured': string;
    'gds.feedback.recorded': string;
    'gds.feedback.flipped': string;
    'gds.feedback.flashed': string;
    'gds.feedback.done': string;
    'gds.feedback.rewarded': string;
    'gds.feedback.paused': string;
    'gds.feedback.mailed': string;
    'gds.feedback.refreshed': string;
    'gds.feedback.loggedOut': string;
    'gds.feedback.filtered': string;
    'gds.feedback.sorted': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

declare const fr: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.saved': string;
    'gds.feedback.error': string;
    'gds.feedback.added': string;
    'gds.feedback.edited': string;
    'gds.feedback.deleted': string;
    'gds.feedback.canceled': string;
    'gds.feedback.confirmed': string;
    'gds.feedback.closed': string;
    'gds.feedback.changed': string;
    'gds.feedback.loaded': string;
    'gds.feedback.started': string;
    'gds.feedback.opened': string;
    'gds.feedback.sent': string;
    'gds.feedback.replied': string;
    'gds.feedback.forwarded': string;
    'gds.feedback.attached': string;
    'gds.feedback.uploaded': string;
    'gds.feedback.downloaded': string;
    'gds.feedback.printed': string;
    'gds.feedback.copied': string;
    'gds.feedback.duplicated': string;
    'gds.feedback.checked': string;
    'gds.feedback.unchecked': string;
    'gds.feedback.completed': string;
    'gds.feedback.cleared': string;
    'gds.feedback.captured': string;
    'gds.feedback.recorded': string;
    'gds.feedback.flipped': string;
    'gds.feedback.flashed': string;
    'gds.feedback.done': string;
    'gds.feedback.rewarded': string;
    'gds.feedback.paused': string;
    'gds.feedback.mailed': string;
    'gds.feedback.refreshed': string;
    'gds.feedback.loggedOut': string;
    'gds.feedback.filtered': string;
    'gds.feedback.sorted': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

declare const it: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.saved': string;
    'gds.feedback.error': string;
    'gds.feedback.added': string;
    'gds.feedback.edited': string;
    'gds.feedback.deleted': string;
    'gds.feedback.canceled': string;
    'gds.feedback.confirmed': string;
    'gds.feedback.closed': string;
    'gds.feedback.changed': string;
    'gds.feedback.loaded': string;
    'gds.feedback.started': string;
    'gds.feedback.opened': string;
    'gds.feedback.sent': string;
    'gds.feedback.replied': string;
    'gds.feedback.forwarded': string;
    'gds.feedback.attached': string;
    'gds.feedback.uploaded': string;
    'gds.feedback.downloaded': string;
    'gds.feedback.printed': string;
    'gds.feedback.copied': string;
    'gds.feedback.duplicated': string;
    'gds.feedback.checked': string;
    'gds.feedback.unchecked': string;
    'gds.feedback.completed': string;
    'gds.feedback.cleared': string;
    'gds.feedback.captured': string;
    'gds.feedback.recorded': string;
    'gds.feedback.flipped': string;
    'gds.feedback.flashed': string;
    'gds.feedback.done': string;
    'gds.feedback.rewarded': string;
    'gds.feedback.paused': string;
    'gds.feedback.mailed': string;
    'gds.feedback.refreshed': string;
    'gds.feedback.loggedOut': string;
    'gds.feedback.filtered': string;
    'gds.feedback.sorted': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

declare const ru: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.saved': string;
    'gds.feedback.error': string;
    'gds.feedback.added': string;
    'gds.feedback.edited': string;
    'gds.feedback.deleted': string;
    'gds.feedback.canceled': string;
    'gds.feedback.confirmed': string;
    'gds.feedback.closed': string;
    'gds.feedback.changed': string;
    'gds.feedback.loaded': string;
    'gds.feedback.started': string;
    'gds.feedback.opened': string;
    'gds.feedback.sent': string;
    'gds.feedback.replied': string;
    'gds.feedback.forwarded': string;
    'gds.feedback.attached': string;
    'gds.feedback.uploaded': string;
    'gds.feedback.downloaded': string;
    'gds.feedback.printed': string;
    'gds.feedback.copied': string;
    'gds.feedback.duplicated': string;
    'gds.feedback.checked': string;
    'gds.feedback.unchecked': string;
    'gds.feedback.completed': string;
    'gds.feedback.cleared': string;
    'gds.feedback.captured': string;
    'gds.feedback.recorded': string;
    'gds.feedback.flipped': string;
    'gds.feedback.flashed': string;
    'gds.feedback.done': string;
    'gds.feedback.rewarded': string;
    'gds.feedback.paused': string;
    'gds.feedback.mailed': string;
    'gds.feedback.refreshed': string;
    'gds.feedback.loggedOut': string;
    'gds.feedback.filtered': string;
    'gds.feedback.sorted': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

declare const he: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.saved': string;
    'gds.feedback.error': string;
    'gds.feedback.added': string;
    'gds.feedback.edited': string;
    'gds.feedback.deleted': string;
    'gds.feedback.canceled': string;
    'gds.feedback.confirmed': string;
    'gds.feedback.closed': string;
    'gds.feedback.changed': string;
    'gds.feedback.loaded': string;
    'gds.feedback.started': string;
    'gds.feedback.opened': string;
    'gds.feedback.sent': string;
    'gds.feedback.replied': string;
    'gds.feedback.forwarded': string;
    'gds.feedback.attached': string;
    'gds.feedback.uploaded': string;
    'gds.feedback.downloaded': string;
    'gds.feedback.printed': string;
    'gds.feedback.copied': string;
    'gds.feedback.duplicated': string;
    'gds.feedback.checked': string;
    'gds.feedback.unchecked': string;
    'gds.feedback.completed': string;
    'gds.feedback.cleared': string;
    'gds.feedback.captured': string;
    'gds.feedback.recorded': string;
    'gds.feedback.flipped': string;
    'gds.feedback.flashed': string;
    'gds.feedback.done': string;
    'gds.feedback.rewarded': string;
    'gds.feedback.paused': string;
    'gds.feedback.mailed': string;
    'gds.feedback.refreshed': string;
    'gds.feedback.loggedOut': string;
    'gds.feedback.filtered': string;
    'gds.feedback.sorted': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

declare const ar: {
    'gds.action.settings': string;
    'gds.action.analytics': string;
    'gds.action.dashboard': string;
    'gds.action.play': string;
    'gds.action.start': string;
    'gds.action.users': string;
    'gds.action.add': string;
    'gds.action.edit': string;
    'gds.action.delete': string;
    'gds.action.save': string;
    'gds.action.cancel': string;
    'gds.action.confirm': string;
    'gds.action.close': string;
    'gds.action.language': string;
    'gds.action.theme': string;
    'gds.action.home': string;
    'gds.action.inbox': string;
    'gds.action.calendar': string;
    'gds.action.gallery': string;
    'gds.action.history': string;
    'gds.action.profile': string;
    'gds.action.send': string;
    'gds.action.reply': string;
    'gds.action.forward': string;
    'gds.action.attach': string;
    'gds.action.upload': string;
    'gds.action.download': string;
    'gds.action.print': string;
    'gds.action.copy': string;
    'gds.action.duplicate': string;
    'gds.action.check': string;
    'gds.action.uncheck': string;
    'gds.action.complete': string;
    'gds.action.clear': string;
    'gds.action.capture': string;
    'gds.action.record': string;
    'gds.action.flip': string;
    'gds.action.flash': string;
    'gds.action.course': string;
    'gds.action.lesson': string;
    'gds.action.certificate': string;
    'gds.action.student': string;
    'gds.action.class': string;
    'gds.action.grade': string;
    'gds.action.child': string;
    'gds.action.family': string;
    'gds.action.habit': string;
    'gds.action.goal': string;
    'gds.action.streak': string;
    'gds.action.reward': string;
    'gds.action.trophy': string;
    'gds.action.crown': string;
    'gds.action.pause': string;
    'gds.action.message': string;
    'gds.action.mail': string;
    'gds.action.refresh': string;
    'gds.action.trendingUp': string;
    'gds.action.trendingDown': string;
    'gds.action.currency': string;
    'gds.action.grid': string;
    'gds.action.list': string;
    'gds.action.logout': string;
    'gds.action.notifications': string;
    'gds.action.back': string;
    'gds.action.eye': string;
    'gds.action.eyeOff': string;
    'gds.action.help': string;
    'gds.action.filter': string;
    'gds.action.sort': string;
    'gds.action.export': string;
    'gds.action.import': string;
    'gds.action.preview': string;
    'gds.action.clone': string;
    'gds.action.restore': string;
    'gds.action.toggle': string;
    'gds.action.search': string;
    'gds.action.submit': string;
    'gds.action.reset': string;
    'gds.action.login': string;
    'gds.action.register': string;
    'gds.action.verify': string;
    'gds.action.launch': string;
    'gds.action.draft': string;
    'gds.action.refer': string;
    'gds.action.evidence': string;
    'gds.feedback.settings': string;
    'gds.feedback.analytics': string;
    'gds.feedback.dashboard': string;
    'gds.feedback.play': string;
    'gds.feedback.start': string;
    'gds.feedback.users': string;
    'gds.feedback.add': string;
    'gds.feedback.edit': string;
    'gds.feedback.delete': string;
    'gds.feedback.save': string;
    'gds.feedback.cancel': string;
    'gds.feedback.confirm': string;
    'gds.feedback.close': string;
    'gds.feedback.language': string;
    'gds.feedback.theme': string;
    'gds.feedback.home': string;
    'gds.feedback.inbox': string;
    'gds.feedback.calendar': string;
    'gds.feedback.gallery': string;
    'gds.feedback.history': string;
    'gds.feedback.profile': string;
    'gds.feedback.send': string;
    'gds.feedback.reply': string;
    'gds.feedback.forward': string;
    'gds.feedback.attach': string;
    'gds.feedback.upload': string;
    'gds.feedback.download': string;
    'gds.feedback.print': string;
    'gds.feedback.copy': string;
    'gds.feedback.duplicate': string;
    'gds.feedback.check': string;
    'gds.feedback.uncheck': string;
    'gds.feedback.complete': string;
    'gds.feedback.clear': string;
    'gds.feedback.capture': string;
    'gds.feedback.record': string;
    'gds.feedback.flip': string;
    'gds.feedback.flash': string;
    'gds.feedback.course': string;
    'gds.feedback.lesson': string;
    'gds.feedback.certificate': string;
    'gds.feedback.student': string;
    'gds.feedback.class': string;
    'gds.feedback.grade': string;
    'gds.feedback.child': string;
    'gds.feedback.family': string;
    'gds.feedback.habit': string;
    'gds.feedback.goal': string;
    'gds.feedback.streak': string;
    'gds.feedback.reward': string;
    'gds.feedback.trophy': string;
    'gds.feedback.crown': string;
    'gds.feedback.pause': string;
    'gds.feedback.message': string;
    'gds.feedback.mail': string;
    'gds.feedback.refresh': string;
    'gds.feedback.trendingUp': string;
    'gds.feedback.trendingDown': string;
    'gds.feedback.currency': string;
    'gds.feedback.grid': string;
    'gds.feedback.list': string;
    'gds.feedback.logout': string;
    'gds.feedback.notifications': string;
    'gds.feedback.back': string;
    'gds.feedback.eye': string;
    'gds.feedback.eyeOff': string;
    'gds.feedback.help': string;
    'gds.feedback.filter': string;
    'gds.feedback.sort': string;
    'gds.feedback.exported': string;
    'gds.feedback.imported': string;
    'gds.feedback.previewed': string;
    'gds.feedback.cloned': string;
    'gds.feedback.restored': string;
    'gds.feedback.toggled': string;
    'gds.feedback.searched': string;
    'gds.feedback.submitted': string;
    'gds.feedback.reset': string;
    'gds.feedback.loggedIn': string;
    'gds.feedback.registered': string;
    'gds.feedback.verified': string;
    'gds.feedback.launched': string;
    'gds.feedback.drafted': string;
    'gds.feedback.referred': string;
    'gds.feedback.error': string;
    'gds.aria.themeToggle': string;
    'gds.state.emptyData': string;
};

export { AccessSummary, type AccessSummaryProps, ArticleShell, type ArticleShellProps, AuthShell, type AuthShellProps, DataToolbar, type DataToolbarFilterChip, type DataToolbarProps, EmptyState, type EmptyStateProps, GdsIcons, GdsVocabulary, MediaCard, type MediaCardAction, type MediaCardProps, MetricCard, type MetricCardProps, ProductCard, type ProductCardAction, type ProductCardMetaItem, type ProductCardProps, ProgressCard, type ProgressCardProps, PublicShell, type PublicShellProps, type SemanticAction, StateBlock, type StateBlockProps, type StateBlockVariant, StatusBadge, type StatusBadgeProps, type StatusVariant, ar, de, en, fr, he, hu, it, ru };
