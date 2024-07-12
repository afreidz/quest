<script lang="ts">
  import CardHeader from "@/components/app/card-header.svelte";
  import type { RespondentFromAll } from "@/actions/respondents";

  type Props = {
    respondent: RespondentFromAll;
  };

  function getRevisionsBySystemId(id: string) {
    return respondent.revisions.filter((r) => r.systemId === id);
  }

  function hasCompletedSurvey(sid: string | null) {
    const survey = respondent.surveys.find((s) => s.id === sid);
    if (!sid || !survey) return false;

    const responses = respondent.responses.filter(
      (r) => r.surveyId === survey.id
    );

    return (
      survey._count.questions > 0 &&
      responses.length === survey._count.questions
    );
  }

  let { respondent }: Props = $props();
</script>

<CardHeader border="{false}">Systems and Revisions</CardHeader>
<div
  class="overflow-x-auto rounded bg-clip-border border border-neutral-200 shadow-sm"
>
  <table class="table table-pin-rows">
    {#each respondent.systems as system}
      <thead>
        <tr class="bg-base-100/15 border-neutral-300">
          <td class="p-4 text-sm" colspan="2">
            <div class="flex justify-between">
              {system.title}
              <i class="badge not-italic badge-primary">{system.client.name}</i>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        {#each getRevisionsBySystemId(system.id) as revision}
          <tr class="bg-neutral border-neutral-200">
            <td class="text-lg py-4">
              <div class="flex gap-4 items-center">
                <iconify-icon icon="bx:revision" class="text-neutral-content/30"
                ></iconify-icon>
                {revision.title}
              </div>
            </td>
            <td class="text-right">
              <aside class="mr-4 inline-flex gap-4">
                {#if hasCompletedSurvey(revision.surveyId)}
                  <span class="badge badge-primary">completed survey</span>
                {/if}
                {#if hasCompletedSurvey(revision.checklistId)}
                  <span class="badge badge-secondary">completed checklist</span>
                {/if}
              </aside>
              <ul class="join">
                {#if revision.surveyId}
                  <li class="contents">
                    <a
                      data-tip="Go to survey"
                      href="{`/public/survey/${respondent.id}/revision/${revision.id}`}"
                      class="join-item btn btn-secondary tooltip tooltip-left tooltip-primary !inline-flex"
                    >
                      <iconify-icon icon="ri:survey-line"></iconify-icon>
                    </a>
                  </li>
                {/if}
                {#if revision.checklistId}
                  <li class="contents">
                    <a
                      href="{`/public/checklist/${respondent.id}/revision/${revision.id}`}"
                      data-tip="Go to checklist"
                      class="join-item btn btn-secondary tooltip tooltip-left tooltip-primary !inline-flex"
                    >
                      <iconify-icon icon="ic:baseline-checklist"></iconify-icon>
                    </a>
                  </li>
                {/if}
                <li class="contents">
                  <a
                    href="{`/moderate-session/${respondent.id}/revision/${revision.id}`}"
                    data-tip="Start a session"
                    class="join-item btn btn-secondary tooltip tooltip-left tooltip-primary !inline-flex"
                  >
                    <iconify-icon icon="tabler:live-photo"></iconify-icon>
                  </a>
                </li>
              </ul>
            </td>
          </tr>
        {/each}
      </tbody>
    {/each}
  </table>
</div>
