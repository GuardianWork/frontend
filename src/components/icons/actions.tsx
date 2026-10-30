import { MapPin } from "lucide-react";
// Adapters normalize the native Radix width/height API to GuardianIconProps.
import * as React from "react";
import type { GuardianIconProps } from "./types";
import { ArrowLeftIcon as RadixArrowLeftIcon } from "./radix/ArrowLeftIcon";
import { ArrowRightIcon as RadixArrowRightIcon } from "./radix/ArrowRightIcon";
import { ArrowTopRightIcon as RadixArrowTopRightIcon } from "./radix/ArrowTopRightIcon";
import { CalendarIcon as RadixCalendarIcon } from "./radix/CalendarIcon";
import { CheckCircledIcon as RadixCheckCircledIcon } from "./radix/CheckCircledIcon";
import { CheckIcon as RadixCheckIcon } from "./radix/CheckIcon";
import { ChevronDownIcon as RadixChevronDownIcon } from "./radix/ChevronDownIcon";
import { ClockIcon as RadixClockIcon } from "./radix/ClockIcon";
import { CopyIcon as RadixCopyIcon } from "./radix/CopyIcon";
import { Cross2Icon as RadixCross2Icon } from "./radix/Cross2Icon";
import { CrossCircledIcon as RadixCrossCircledIcon } from "./radix/CrossCircledIcon";
import { DotsHorizontalIcon as RadixDotsHorizontalIcon } from "./radix/DotsHorizontalIcon";
import { DownloadIcon as RadixDownloadIcon } from "./radix/DownloadIcon";
import { EnvelopeClosedIcon as RadixEnvelopeClosedIcon } from "./radix/EnvelopeClosedIcon";
import { ExclamationTriangleIcon as RadixExclamationTriangleIcon } from "./radix/ExclamationTriangleIcon";
import { ExitIcon as RadixExitIcon } from "./radix/ExitIcon";
import { ExternalLinkIcon as RadixExternalLinkIcon } from "./radix/ExternalLinkIcon";
import { EyeClosedIcon as RadixEyeClosedIcon } from "./radix/EyeClosedIcon";
import { EyeOpenIcon as RadixEyeOpenIcon } from "./radix/EyeOpenIcon";
import { GlobeIcon as RadixGlobeIcon } from "./radix/GlobeIcon";
import { HamburgerMenuIcon as RadixHamburgerMenuIcon } from "./radix/HamburgerMenuIcon";
import { InfoCircledIcon as RadixInfoCircledIcon } from "./radix/InfoCircledIcon";
import { Link2Icon as RadixLink2Icon } from "./radix/Link2Icon";
import { LockClosedIcon as RadixLockClosedIcon } from "./radix/LockClosedIcon";
import { MagnifyingGlassIcon as RadixMagnifyingGlassIcon } from "./radix/MagnifyingGlassIcon";
import { MixerHorizontalIcon as RadixMixerHorizontalIcon } from "./radix/MixerHorizontalIcon";
import { MobileIcon as RadixMobileIcon } from "./radix/MobileIcon";
import { Pencil1Icon as RadixPencil1Icon } from "./radix/Pencil1Icon";
import { PlusIcon as RadixPlusIcon } from "./radix/PlusIcon";
import { ReloadIcon as RadixReloadIcon } from "./radix/ReloadIcon";
import { TrashIcon as RadixTrashIcon } from "./radix/TrashIcon";
import { UpdateIcon as RadixUpdateIcon } from "./radix/UpdateIcon";
import { UploadIcon as RadixUploadIcon } from "./radix/UploadIcon";

function actionIcon(Symbol: React.ComponentType<React.SVGProps<SVGSVGElement>>, name: string) {
  const Icon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
    ({ size = 15, width, height, title, children, ...props }, ref) => {
      return (
        <Symbol
          ref={ref}
          width={width ?? size}
          height={height ?? size}
          role={title ? "img" : undefined}
          aria-label={title}
          aria-hidden={title ? undefined : true}
          focusable="false"
          {...props}
        >
          {children}
        </Symbol>
      );
    },
  );
  Icon.displayName = name;
  return Icon;
}
export const SearchIcon = actionIcon(RadixMagnifyingGlassIcon, "SearchIcon");
export const FilterIcon = actionIcon(RadixMixerHorizontalIcon, "FilterIcon");
export const CloseIcon = actionIcon(RadixCross2Icon, "CloseIcon");
export const MenuIcon = actionIcon(RadixHamburgerMenuIcon, "MenuIcon");
export const ChevronDownIcon = actionIcon(RadixChevronDownIcon, "ChevronDownIcon");
export const ArrowRightIcon = actionIcon(RadixArrowRightIcon, "ArrowRightIcon");
export const ExternalLinkIcon = actionIcon(RadixExternalLinkIcon, "ExternalLinkIcon");
export const MoreIcon = actionIcon(RadixDotsHorizontalIcon, "MoreIcon");
export const AddIcon = actionIcon(RadixPlusIcon, "AddIcon");
export const EditIcon = actionIcon(RadixPencil1Icon, "EditIcon");
export const DeleteIcon = actionIcon(RadixTrashIcon, "DeleteIcon");
export const UploadIcon = actionIcon(RadixUploadIcon, "UploadIcon");
export const DownloadIcon = actionIcon(RadixDownloadIcon, "DownloadIcon");
export const RefreshIcon = actionIcon(RadixReloadIcon, "RefreshIcon");
export const CopyIcon = actionIcon(RadixCopyIcon, "CopyIcon");
export const LinkIcon = actionIcon(RadixLink2Icon, "LinkIcon");
export const InformationIcon = actionIcon(RadixInfoCircledIcon, "InformationIcon");
export const WarningIcon = actionIcon(RadixExclamationTriangleIcon, "WarningIcon");
export const CheckIcon = actionIcon(RadixCheckIcon, "CheckIcon");
export const ErrorIcon = actionIcon(RadixCrossCircledIcon, "ErrorIcon");
export const VisibleIcon = actionIcon(RadixEyeOpenIcon, "VisibleIcon");
export const HiddenIcon = actionIcon(RadixEyeClosedIcon, "HiddenIcon");
export const GlobeIcon = actionIcon(RadixGlobeIcon, "GlobeIcon");
export const EmailIcon = actionIcon(RadixEnvelopeClosedIcon, "EmailIcon");
export const PhoneIcon = actionIcon(RadixMobileIcon, "PhoneIcon");
export const CalendarIcon = actionIcon(RadixCalendarIcon, "CalendarIcon");
export const LogoutIcon = actionIcon(RadixExitIcon, "LogoutIcon");
export const LockIcon = actionIcon(RadixLockClosedIcon, "LockIcon");
export const PendingIcon = actionIcon(RadixClockIcon, "PendingIcon");
export const VerifiedIcon = actionIcon(RadixCheckCircledIcon, "VerifiedIcon");
export const RejectedIcon = actionIcon(RadixCrossCircledIcon, "RejectedIcon");
export const ArrowLeftIcon = actionIcon(RadixArrowLeftIcon, "ArrowLeftIcon");
export const ArrowUpRightIcon = actionIcon(RadixArrowTopRightIcon, "ArrowUpRightIcon");
export const LoadingIcon = actionIcon(RadixUpdateIcon, "LoadingIcon");

// Geographic location; Radix PinLeftIcon means pin-to-edge, not a place.
export const LocationIcon = actionIcon(MapPin, "LocationIcon");
