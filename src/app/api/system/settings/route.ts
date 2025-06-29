import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // System settings should be available even without authentication for login page
    const settings = await prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // If no settings exist, return defaults for first-time setup
    if (!settings) {
      return NextResponse.json({
        settings: {
          id: null,
          systemName: "Infrastructure Monitoring System",
          systemSubtitle: "Project Management Platform",
          organizationName: "Your Organization",
          organizationSubtitle: "Infrastructure Department",
          loginTitle: "Secure Access Portal",
          loginDescription: "Authorized personnel only - Enter your credentials to access the system",
          loginFooterText: "Contact administrator for account registration",
          dashboardWelcomeTitle: "Welcome to the System",
          dashboardWelcomeText: "Select a project to start monitoring infrastructure progress",
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
          currencyCode: "USD",
          currencySymbol: "$",
          dateFormat: "MM/dd/yyyy",
          timeZone: "UTC",
          enableGpsTracking: true,
          enableContractors: true,
          enableFinancials: true,
          enableReports: true,
          systemVersion: "1.0.0",
          isSetupComplete: false
        },
        isFirstTimeSetup: true,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      settings,
      isFirstTimeSetup: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({
      error: 'Failed to fetch system settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const {
      systemName,
      systemSubtitle,
      organizationName,
      organizationSubtitle,
      loginTitle,
      loginDescription,
      loginFooterText,
      dashboardWelcomeTitle,
      dashboardWelcomeText,
      primaryColor,
      secondaryColor,
      accentColor,
      logoUrl,
      faviconUrl,
      currencyCode,
      currencySymbol,
      dateFormat,
      timeZone,
      enableGpsTracking,
      enableContractors,
      enableFinancials,
      enableReports,
      supportEmail,
      supportPhone
    } = await request.json();

    // Check if settings already exist
    const existingSettings = await prisma.systemSettings.findFirst();

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: {
          systemName: systemName?.trim() || existingSettings.systemName,
          systemSubtitle: systemSubtitle?.trim() || existingSettings.systemSubtitle,
          organizationName: organizationName?.trim() || existingSettings.organizationName,
          organizationSubtitle: organizationSubtitle?.trim() || existingSettings.organizationSubtitle,
          loginTitle: loginTitle?.trim() || existingSettings.loginTitle,
          loginDescription: loginDescription?.trim() || existingSettings.loginDescription,
          loginFooterText: loginFooterText?.trim() || existingSettings.loginFooterText,
          dashboardWelcomeTitle: dashboardWelcomeTitle?.trim() || existingSettings.dashboardWelcomeTitle,
          dashboardWelcomeText: dashboardWelcomeText?.trim() || existingSettings.dashboardWelcomeText,
          primaryColor: primaryColor?.trim() || existingSettings.primaryColor,
          secondaryColor: secondaryColor?.trim() || existingSettings.secondaryColor,
          accentColor: accentColor?.trim() || existingSettings.accentColor,
          logoUrl: logoUrl?.trim() || existingSettings.logoUrl,
          faviconUrl: faviconUrl?.trim() || existingSettings.faviconUrl,
          currencyCode: currencyCode?.trim() || existingSettings.currencyCode,
          currencySymbol: currencySymbol?.trim() || existingSettings.currencySymbol,
          dateFormat: dateFormat?.trim() || existingSettings.dateFormat,
          timeZone: timeZone?.trim() || existingSettings.timeZone,
          enableGpsTracking: enableGpsTracking !== undefined ? enableGpsTracking : existingSettings.enableGpsTracking,
          enableContractors: enableContractors !== undefined ? enableContractors : existingSettings.enableContractors,
          enableFinancials: enableFinancials !== undefined ? enableFinancials : existingSettings.enableFinancials,
          enableReports: enableReports !== undefined ? enableReports : existingSettings.enableReports,
          supportEmail: supportEmail?.trim() || existingSettings.supportEmail,
          supportPhone: supportPhone?.trim() || existingSettings.supportPhone,
          isSetupComplete: true
        }
      });
    } else {
      // Create new settings
      settings = await prisma.systemSettings.create({
        data: {
          systemName: systemName?.trim() || "Monitoring System",
          systemSubtitle: systemSubtitle?.trim() || "Construction Management Platform",
          organizationName: organizationName?.trim() || "Government Department",
          organizationSubtitle: organizationSubtitle?.trim() || "Infrastructure Development",
          loginTitle: loginTitle?.trim() || "Secure Access Portal",
          loginDescription: loginDescription?.trim() || "Authorized personnel only - Enter your credentials to access the system",
          loginFooterText: loginFooterText?.trim() || "Contact administrator for account registration",
          dashboardWelcomeTitle: dashboardWelcomeTitle?.trim() || "Welcome to the System",
          dashboardWelcomeText: dashboardWelcomeText?.trim() || "Select a project to start monitoring progress",
          primaryColor: primaryColor?.trim() || "#3B82F6",
          secondaryColor: secondaryColor?.trim() || "#10B981",
          accentColor: accentColor?.trim() || "#F59E0B",
          logoUrl: logoUrl?.trim() || null,
          faviconUrl: faviconUrl?.trim() || null,
          currencyCode: currencyCode?.trim() || "USD",
          currencySymbol: currencySymbol?.trim() || "$",
          dateFormat: dateFormat?.trim() || "MM/dd/yyyy",
          timeZone: timeZone?.trim() || "UTC",
          enableGpsTracking: enableGpsTracking !== undefined ? enableGpsTracking : true,
          enableContractors: enableContractors !== undefined ? enableContractors : true,
          enableFinancials: enableFinancials !== undefined ? enableFinancials : true,
          enableReports: enableReports !== undefined ? enableReports : true,
          supportEmail: supportEmail?.trim() || null,
          supportPhone: supportPhone?.trim() || null,
          isSetupComplete: true
        }
      });
    }

    console.log(`✅ System settings updated by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      settings,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json({
      error: 'Failed to update system settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Alias for POST to support updates
  return POST(request);
}
