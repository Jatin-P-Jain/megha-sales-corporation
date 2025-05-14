"use client";

import useIsMobile from "@/hooks/useIsMobile";
import { Breadcrumbs } from "../ui/breadcrumb";

const EllipsisBreadCrumbs = ({
  items,
}: {
  items: { href?: string; label: string }[];
}) => {
  const isMobile = useIsMobile();
  return <Breadcrumbs items={items} isSmallScreen={isMobile} />;
};
export default EllipsisBreadCrumbs;
