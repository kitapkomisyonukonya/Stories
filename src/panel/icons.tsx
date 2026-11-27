import type { SVGProps } from 'react';

/** The few line icons the panel uses, drawn in one style (24 px grid, 1.8 px stroke). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const make = (paths: string, name: string) => {
  const Icon = ({ size = 20, ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
  Icon.displayName = name;
  return Icon;
};

export const IconHome = make('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>', 'IconHome');
export const IconBooks = make('<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5Z"/><path d="M8 7h7"/><path d="M8 11h5"/>', 'IconBooks');
export const IconEdit = make('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>', 'IconEdit');
export const IconSparkDoc = make('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M12 12v5"/><path d="M9.5 14.5h5"/>', 'IconNewBook');
export const IconImage = make('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>', 'IconImage');
export const IconInbox = make('<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/>', 'IconInbox');
export const IconUsers = make('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.5a3.2 3.2 0 0 1 0 6.2"/><path d="M18 14.5a6 6 0 0 1 3 5.5"/>', 'IconUsers');
export const IconClock = make('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'IconClock');
export const IconHelp = make('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.4v.5"/><path d="M12 17h.01"/>', 'IconHelp');
export const IconSearch = make('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 'IconSearch');
export const IconPlus = make('<path d="M12 5v14"/><path d="M5 12h14"/>', 'IconPlus');
export const IconTrash = make('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>', 'IconTrash');
export const IconUp = make('<path d="m6 15 6-6 6 6"/>', 'IconUp');
export const IconDown = make('<path d="m6 9 6 6 6-6"/>', 'IconDown');
export const IconCopy = make('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', 'IconCopy');
export const IconCheck = make('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'IconCheck');
export const IconX = make('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 'IconX');
export const IconUndo = make('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', 'IconUndo');
export const IconPhone = make('<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>', 'IconPhone');
export const IconDesktop = make('<rect x="2.5" y="4" width="19" height="13" rx="1.8"/><path d="M8 21h8"/><path d="M12 17v4"/>', 'IconDesktop');
export const IconTablet = make('<rect x="4.5" y="2.5" width="15" height="19" rx="2"/><path d="M11 18.5h2"/>', 'IconTablet');
export const IconPointer = make('<path d="m5 3 14 7-6 2-2 6Z"/>', 'IconPointer');
export const IconUpload = make('<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>', 'IconUpload');
export const IconSound = make('<path d="M4 9.5v5h4l5 4v-13l-5 4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>', 'IconSound');
export const IconWarn = make('<path d="M12 3 2 20h20Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', 'IconWarn');
export const IconInfo = make('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>', 'IconInfo');
export const IconSend = make('<path d="M4 12 20 4l-6 16-3-7Z"/><path d="m11 13 9-9"/>', 'IconSend');
export const IconLogout = make('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/>', 'IconLogout');
export const IconEye = make('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>', 'IconEye');
export const IconEyeOff = make('<path d="M3 3l18 18"/><path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7"/><path d="M6.4 6.9A15.8 15.8 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.3-1"/>', 'IconEyeOff');
export const IconMap = make('<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5Z"/><path d="M9 4v13.5"/><path d="M15 6.5V20"/>', 'IconMap');
export const IconRocket = make('<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 15l-3-3c1.5-5 6-9 12-9 0 6-4 10.5-9 12Z"/><circle cx="15" cy="9" r="1.6"/>', 'IconRocket');
export const IconCard = make('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.5 1.7-2.3 3-2.3s2.4.8 3 2.3"/><path d="M14 10h4"/><path d="M14 13.5h3"/>', 'IconCard');
export const IconMenu = make('<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>', 'IconMenu');
export const IconChevron = make('<path d="m9 6 6 6-6 6"/>', 'IconChevron');
export const IconBack = make('<path d="m15 6-6 6 6 6"/>', 'IconBack');
export const IconRefresh = make('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>', 'IconRefresh');
export const IconGrip = make('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>', 'IconGrip');
export const IconTeacher = make('<path d="M2.5 9 12 4.5 21.5 9 12 13.5Z"/><path d="M6.5 11v4.5c1.5 1.5 3.5 2.3 5.5 2.3s4-.8 5.5-2.3V11"/><path d="M21.5 9v5"/>', 'IconTeacher');
export const IconChart = make('<path d="M4 20h16"/><path d="M7 16v-5"/><path d="M12 16V7"/><path d="M17 16v-8"/>', 'IconChart');
export const IconBell = make('<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10 20a2 2 0 0 0 4 0"/>', 'IconBell');
export const IconLink = make('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', 'IconLink');
